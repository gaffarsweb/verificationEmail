// chatConnect.js — separate socket.io connection for in-game chat.
// Mirrors src/socket/chatConnect.js from the React Native app so the same
// JOIN_GAME_CHAT / SEND_MESSAGES / RECEIVE_MESSAGES protocol works here.
import { io } from "socket.io-client";

// Same host as the game socket by default. Override here (or via .env / build
// config) if your chat service lives elsewhere — the RN app points at
// `http://pokerchat.onsdlc.cloud` in production.
export const CHAT_SOCKET_URL = "http://pokerchat.onsdlc.cloud";

export const CHAT_EVENTS = {
  JOIN_GAME_CHAT: "JOIN_GAME_CHAT",
  SEND_MESSAGES: "SEND_MESSAGES",
  RECEIVE_MESSAGES: "RECEIVE_MESSAGES",
  SEND_STICKERS: "SEND_STICKERS",
  RECEIVE_STICKERS: "RECEIVE_STICKERS",
};

let chatSocket = null;
let listeners = new Set();
let stickerListeners = new Set();

// The chat server emits RECEIVE_MESSAGES with the actual message nested under
// a `message` field (the RN store does `const { message } = action.payload`).
// Some events (stickers, plain payloads) come flat. Always hand the flat
// message object to subscribers so they can render `m.message` / `m.name`
// directly without guessing the envelope.
const unwrap = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  const inner = payload.message;
  if (inner && typeof inner === "object") return inner;
  return payload;
};

const fanout = (raw) => {
  const msg = unwrap(raw);
  listeners.forEach((cb) => {
    try {
      cb(msg);
    } catch (_) {}
  });
};

export const initializeSocketChat = (userId) => {
  if (!userId) {
    console.warn("CHAT - cannot init: userId missing");
    return null;
  }
  if (chatSocket && chatSocket.connected) return chatSocket;
  if (chatSocket && !chatSocket.connected) {
    chatSocket.connect();
    return chatSocket;
  }

  chatSocket = io(CHAT_SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    query: { playerId: userId },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  chatSocket.on("connect", () => {
    console.log("CHAT - connected", chatSocket.id, userId);
  });
  chatSocket.on("disconnect", (r) => console.warn("CHAT - disconnected", r));
  chatSocket.on("connect_error", (e) =>
    console.error("CHAT - connect_error", e?.message)
  );

  chatSocket.on(CHAT_EVENTS.RECEIVE_MESSAGES, (data) => fanout(data));
  // Stickers go to a separate fanout — they carry {table, from, to, message:
  // {stickerId, ...}, type} and the consumer needs the original envelope to
  // know who sent it and which seat to target, so do NOT unwrap.
  chatSocket.on(CHAT_EVENTS.RECEIVE_STICKERS, (data) =>
    fanoutStickers({ ...data, type: CHAT_EVENTS.RECEIVE_STICKERS })
  );
  chatSocket.on(CHAT_EVENTS.SEND_STICKERS, (data) =>
    fanoutStickers({ ...data, type: CHAT_EVENTS.SEND_STICKERS })
  );

  return chatSocket;
};

const fanoutStickers = (payload) => {
  stickerListeners.forEach((cb) => {
    try {
      cb(payload);
    } catch (_) {}
  });
};

export const getSocketChat = () => chatSocket;

export const disconnectSocketChat = () => {
  if (chatSocket) {
    chatSocket.removeAllListeners();
    chatSocket.disconnect();
    chatSocket = null;
    listeners.clear();
    stickerListeners.clear();
  }
};

// Subscribe to every inbound chat message (RECEIVE_MESSAGES, stickers).
// Returns an unsubscribe function.
export const subscribeChatMessages = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const joinGameChat = (tableId) => {
  if (!chatSocket || !tableId) return;
  // Mirrors the RN flow: tableId is sent as a Number.
  chatSocket.emit(CHAT_EVENTS.JOIN_GAME_CHAT, Number(tableId));
};

export const sendChatMessage = (payload) => {
  if (!chatSocket) return;
  chatSocket.emit(CHAT_EVENTS.SEND_MESSAGES, payload);
};

// Subscribe to sticker broadcasts (SEND_STICKERS + RECEIVE_STICKERS).
// Subscriber receives the raw envelope { type, table, from, to, message, ... }
// so it can decide based on `type` whether to animate / suppress own echo.
export const subscribeChatStickers = (cb) => {
  stickerListeners.add(cb);
  return () => stickerListeners.delete(cb);
};

export const sendSticker = (payload) => {
  if (!chatSocket) return;
  chatSocket.emit(CHAT_EVENTS.SEND_STICKERS, payload);
};
