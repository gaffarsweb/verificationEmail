import React, { useEffect, useMemo, useReducer, useState } from "react";
import { io } from "socket.io-client";
import "./NiuBullGame.css";

const SOCKET_URL = "https://poker-api.testsdlc.in";

// Module-level socket singleton — survives re-renders without a useRef.
let socket = null;
let joinedTableIdGlobal = null;

const SUIT_LABEL = { s: "♠", h: "♥", d: "♦", c: "♣" };
const SUIT_COLOR = { s: "#111", h: "#d11", d: "#d11", c: "#111" };

const initialState = {
  connected: false,
  myPlayerId: null,
  mySeatId: null,

  table: null,
  phase: "IDLE",
  roundId: null,

  currentTurnSeatId: null,
  turnTimerMs: 0,
  turnTimerStart: 0,

  waitTimerMs: 0,
  waitTimerStart: 0,
  statusBanner: "",

  myCards: [],
  suggestion: null,

  topSlot: [],
  bottomSlot: [],
  usedSuggest: false,

  revealedHands: {},
  winners: [],
  losers: [],
  winningHand: null,
  showWinnerBanner: false,
  isPush: false,

  lastSettlement: null,

  myBalance: null,
  displayedStacks: {},
  flyingChips: [],
  floatingDeltas: [],

  showTopUpModal: false,
  topUpInfo: null,

  toasts: [],
};

function reducer(state, action) {
  console.log("Action:", action);
  console.log("Before:", state);
  switch (action.type) {
    case "CONNECTED":
      return { ...state, connected: action.value };

    case "IDENTITY":
      return { ...state, myPlayerId: action.playerId };

    case "TABLE_SNAPSHOT": {
      console.log("Received table snapshot", action?.table);
      const t = action.table || null;
      const phase = t?.phase || state.phase;
      let mySeatId = state.mySeatId;
      const displayedStacks = { ...state.displayedStacks };
      if (t) {
        if (state.myPlayerId != null) {
          mySeatId = null;
          for (const sid of Object.keys(t.seats || {})) {
            const s = t.seats[sid];
            if (s && s.player && String(s.player.id) === String(state.myPlayerId)) {
              mySeatId = Number(sid);
              break;
            }
          }
        }
        // Seed displayedStacks for seats that don't have one yet (don't clobber
        // mid-tween values — the animator owns those).
        for (const sid of Object.keys(t.seats || {})) {
          const s = t.seats[sid];
          if (s && displayedStacks[sid] == null) {
            displayedStacks[sid] = s.stack ?? 0;
          }
        }
      }
      return {
        ...state,
        table: t,
        phase,
        mySeatId,
        displayedStacks,
        currentTurnSeatId: t?.currentTurnSeatId ?? state.currentTurnSeatId,
      };
    }

    case "STATUS":
      return { ...state, statusBanner: action.text };

    case "WAIT_COUNTDOWN":
      return {
        ...state,
        phase: "WAITING",
        statusBanner: "",
        waitTimerMs: action.waitMs,
        waitTimerStart: Date.now(),
        revealedHands: {},
        winners: [],
        losers: [],
        winningHand: null,
        showWinnerBanner: false,
      };

    case "CANCEL_COUNTDOWN":
      return { ...state, waitTimerMs: 0 };

    case "ROUND_BEGIN":
      return {
        ...state,
        phase: "ARRANGING",
        roundId: action.roundId,
        statusBanner: "Round in progress",
        revealedHands: {},
        winners: [],
        losers: [],
        winningHand: null,
        showWinnerBanner: false,
        topSlot: [],
        bottomSlot: [],
        usedSuggest: false,
      };

    case "ROUND_END":
      return { ...state, currentTurnSeatId: null, turnTimerMs: 0, phase: "WAITING" };

    case "MY_CARDS":
      return {
        ...state,
        myCards: action.cards,
        suggestion: action.suggestion,
        topSlot: [],
        bottomSlot: [],
        usedSuggest: false,
      };

    case "SUGGEST_HINT":
      return { ...state, suggestion: { top: action.top, bottom: action.bottom } };

    case "ACCEPT_SUGGEST":
      if (!state.suggestion) return state;
      return {
        ...state,
        topSlot: state.suggestion.top,
        bottomSlot: state.suggestion.bottom,
        usedSuggest: true,
      };

    case "MOVE_CARD_TO_TOP": {
      const card = action.card;
      if (state.topSlot.length >= 2) return state;
      return {
        ...state,
        topSlot: [...state.topSlot, card],
        bottomSlot: state.bottomSlot.filter((c) => !sameCard(c, card)),
      };
    }
    case "MOVE_CARD_TO_BOTTOM": {
      const card = action.card;
      if (state.bottomSlot.length >= 3) return state;
      return {
        ...state,
        bottomSlot: [...state.bottomSlot, card],
        topSlot: state.topSlot.filter((c) => !sameCard(c, card)),
      };
    }
    case "REMOVE_FROM_SLOTS": {
      return {
        ...state,
        topSlot: state.topSlot.filter((c) => !sameCard(c, action.card)),
        bottomSlot: state.bottomSlot.filter((c) => !sameCard(c, action.card)),
      };
    }
    case "RESET_ARRANGEMENT":
      return { ...state, topSlot: [], bottomSlot: [], usedSuggest: false };

    case "TURN":
      return {
        ...state,
        currentTurnSeatId: action.seatId,
        turnTimerMs: action.timerMs,
        turnTimerStart: Date.now(),
      };

    case "TURN_TIMEOUT":
      return { ...state, turnTimerMs: 0 };

    case "OPPONENT_REVEAL":
      return {
        ...state,
        revealedHands: {
          ...state.revealedHands,
          [action.seatId]: {
            topHand: action.topHand,
            bottomHand: action.bottomHand,
            result: action.result,
            autoArranged: action.autoArranged,
            fromSuggest: action.fromSuggest,
          },
        },
      };

    case "EVAL":
      return {
        ...state,
        revealedHands: {
          ...state.revealedHands,
          [action.seatId]: { ...(state.revealedHands[action.seatId] || {}), result: action.result },
        },
      };

    case "WINNERS":
      return { ...state, winners: action.winners || [], isPush: !!action.isPush };

    case "REVEAL_BANNER":
      return { ...state, winningHand: action.winningHand, showWinnerBanner: true };

    case "HIDE_BANNER":
      return { ...state, showWinnerBanner: false };

    case "SETTLEMENT":
      return { ...state, lastSettlement: action.payload };

    case "MY_BALANCE":
      return { ...state, myBalance: action.balance };

    case "SPAWN_FLYING_CHIP":
      return { ...state, flyingChips: [...state.flyingChips, action.chip] };
    case "REMOVE_FLYING_CHIP":
      return { ...state, flyingChips: state.flyingChips.filter((c) => c.id !== action.id) };

    case "SPAWN_FLOATING_DELTA":
      return { ...state, floatingDeltas: [...state.floatingDeltas, action.delta] };
    case "REMOVE_FLOATING_DELTA":
      return { ...state, floatingDeltas: state.floatingDeltas.filter((d) => d.id !== action.id) };

    case "SET_DISPLAYED_STACK":
      return {
        ...state,
        displayedStacks: { ...state.displayedStacks, [action.seatId]: action.value },
      };
    case "SET_DISPLAYED_STACKS":
      return { ...state, displayedStacks: { ...state.displayedStacks, ...action.stacks } };

    case "SHOW_TOPUP":
      return { ...state, showTopUpModal: true, topUpInfo: action.info };

    case "HIDE_TOPUP":
      return { ...state, showTopUpModal: false, topUpInfo: null };

    case "TOAST_PUSH":
      return { ...state, toasts: [...state.toasts, action.toast] };

    case "TOAST_POP":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case "FULL_RESET":
      return { ...initialState, myPlayerId: state.myPlayerId, connected: state.connected };

    default:
      return state;
  }
}

function sameCard(a, b) {
  return a && b && a.rank === b.rank && a.suit === b.suit;
}

function isCardInList(card, list) {
  return list.some((c) => sameCard(c, card));
}

function fmtTime(ms) {
  if (ms <= 0) return "0:00";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function CardView({ card, onClick, dim, highlighted, small }) {
  const color = SUIT_COLOR[card.suit] || "#111";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`nb-card ${small ? "small" : ""} ${dim ? "dim" : ""} ${highlighted ? "hl" : ""}`}
      style={{ color }}
    >
      <span className="nb-card-rank">{card.rank}</span>
      <span className="nb-card-suit">{SUIT_LABEL[card.suit] || card.suit}</span>
    </button>
  );
}

function SeatBox({ seatId, seat, isMine, isTurn, revealed, displayedStack }) {
  const empty = !seat;
  const sittingOut = seat?.sittingOut;
  return (
    <div
      data-seat-id={seatId}
      className={`nb-seat ${empty ? "empty" : ""} ${isMine ? "mine" : ""} ${isTurn ? "turn" : ""} ${sittingOut ? "out" : ""}`}
    >
      <div className="nb-seat-head">
        <span className="nb-seat-id">Seat {seatId}</span>
        {isMine && <span className="nb-badge me">YOU</span>}
        {isTurn && <span className="nb-badge turn">ACTING</span>}
        {sittingOut && <span className="nb-badge out">SIT OUT</span>}
      </div>
      {empty ? (
        <div className="nb-seat-empty">Empty</div>
      ) : (
        <>
          <div className="nb-seat-name">{seat.player?.name?.username || seat.player?.name || `P${seat.player?.id}`}</div>
          <div className="nb-seat-stack">
            Stack: <b className="nb-stack-num">{displayedStack ?? seat.stack ?? 0}</b>
          </div>
          {revealed && (
            <div className="nb-seat-reveal">
              <div className="nb-seat-row">
                <span className="nb-mini-label">Top</span>
                {revealed.topHand?.map((c, i) => (
                  <CardView key={`t-${i}`} card={c} small onClick={() => {}} />
                ))}
              </div>
              <div className="nb-seat-row">
                <span className="nb-mini-label">Bot</span>
                {revealed.bottomHand?.map((c, i) => (
                  <CardView key={`b-${i}`} card={c} small onClick={() => {}} />
                ))}
              </div>
              {revealed.result && (
                <div className="nb-seat-hand">
                  {revealed.result.label} ({revealed.result.multiplier}x)
                  {revealed.autoArranged ? " · Auto" : ""}
                </div>
              )}
            </div>
          )}
          {!revealed && seat.isConfirmed && <div className="nb-seat-confirmed">Confirmed</div>}
        </>
      )}
    </div>
  );
}

export default function NiuBullGame() {
  const [tableId, setTableId] = useState("T-001");
  const [playerId, setPlayerId] = useState("");
  const [username, setUsername] = useState("");
  const [joinedTableId, setJoinedTableId] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState(200);
  const [pickedSeat, setPickedSeat] = useState("");

  const [state, dispatch] = useReducer(reducer, initialState);

  const [tickNow, setTickNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setTickNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const turnRemaining = useMemo(() => {
    if (!state.turnTimerMs) return 0;
    return Math.max(0, state.turnTimerMs - (tickNow - state.turnTimerStart));
  }, [tickNow, state.turnTimerMs, state.turnTimerStart]);

  const waitRemaining = useMemo(() => {
    if (!state.waitTimerMs) return 0;
    return Math.max(0, state.waitTimerMs - (tickNow - state.waitTimerStart));
  }, [tickNow, state.waitTimerMs, state.waitTimerStart]);

  const pushToast = (text, kind = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    dispatch({ type: "TOAST_PUSH", toast: { id, text, kind } });
    setTimeout(() => dispatch({ type: "TOAST_POP", id }), 3500);
  };

  // ─── Animation helpers (chip fly + stack count + floating delta text) ───

  const seatCenter = (seatId) => {
    const el = document.querySelector(`[data-seat-id="${seatId}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const spawnFloatingDeltaAt = (seatId, amount, kind) => {
    const center = seatCenter(seatId);
    if (!center) return;
    const id = `fd-${Date.now()}-${Math.random()}`;
    dispatch({
      type: "SPAWN_FLOATING_DELTA",
      delta: { id, x: center.x, y: center.y, amount, kind },
    });
    setTimeout(() => dispatch({ type: "REMOVE_FLOATING_DELTA", id }), 1800);
  };

  const spawnFlyingChip = (fromSeatId, toSeatId, delay = 0, idx = 0) => {
    const from = seatCenter(fromSeatId);
    const to = seatCenter(toSeatId);
    if (!from || !to) return;
    const id = `chip-${Date.now()}-${Math.random()}-${idx}`;
    // small random offset so multiple chips don't perfectly overlap
    const jitterX = (Math.random() - 0.5) * 28;
    const jitterY = (Math.random() - 0.5) * 14;
    setTimeout(() => {
      dispatch({
        type: "SPAWN_FLYING_CHIP",
        chip: {
          id,
          fromX: from.x + jitterX,
          fromY: from.y + jitterY,
          dx: to.x - from.x,
          dy: to.y - from.y,
        },
      });
      setTimeout(() => dispatch({ type: "REMOVE_FLYING_CHIP", id }), 1400);
    }, delay);
  };

  // Tween a single seat's displayed stack toward a target over `durationMs`.
  const tweenStack = (seatId, target, durationMs = 1500) => {
    const startVal =
      (window.__nbDisplayed && window.__nbDisplayed[seatId]) ??
      state.displayedStacks?.[seatId] ??
      state.table?.seats?.[seatId]?.stack ??
      0;
    const startTime = Date.now();
    if (!window.__nbDisplayed) window.__nbDisplayed = {};
    const step = () => {
      const t = Math.min(1, (Date.now() - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const value = Math.round(startVal + (target - startVal) * eased);
      window.__nbDisplayed[seatId] = value;
      dispatch({ type: "SET_DISPLAYED_STACK", seatId, value });
      if (t < 1) requestAnimationFrame(step);
      else window.__nbDisplayed[seatId] = target;
    };
    requestAnimationFrame(step);
  };

  const runSettlementAnimation = (payload) => {
    if (payload.isPush) return;
    const winners = payload.winnerCredits || [];
    const losers = payload.loserDebits || [];

    // Floating "-X" / "+X" texts
    losers.forEach((l) => spawnFloatingDeltaAt(l.seatId, -l.amount, "loss"));
    winners.forEach((w) => {
      setTimeout(() => spawnFloatingDeltaAt(w.seatId, w.amount, "win"), 600);
    });

    // Chips fly loser → each winner (3 chips per pair, staggered)
    losers.forEach((l, li) => {
      winners.forEach((w, wi) => {
        for (let k = 0; k < 3; k++) {
          spawnFlyingChip(l.seatId, w.seatId, li * 80 + wi * 60 + k * 130, k);
        }
      });
    });

    // Tween stacks: losers down, winners up
    const tableSeats = state.table?.seats || {};
    losers.forEach((l) => {
      const before = tableSeats[l.seatId]?.stack ?? state.displayedStacks[l.seatId] ?? 0;
      tweenStack(l.seatId, before - l.amount, 1300);
    });
    winners.forEach((w) => {
      const before = tableSeats[w.seatId]?.stack ?? state.displayedStacks[w.seatId] ?? 0;
      // Slight delay so the chips appear to "land" before the count jumps up
      setTimeout(() => tweenStack(w.seatId, before + w.amount, 1300), 500);
    });
  };

  const connect = () => {
    if (socket) return socket;
    const pid = playerId.trim();
    const uname = username.trim() || `Player_${pid || Math.floor(Math.random() * 9999)}`;
    if (!pid) {
      pushToast("Player ID is required", "error");
      return null;
    }

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      query: { playerId: pid },
    });

    dispatch({ type: "IDENTITY", playerId: pid });

    socket.on("connect", () => {
      dispatch({ type: "CONNECTED", value: true });
      pushToast("Connected — registering player...");
      // Server requires FETCH_LOBBY_INFO with a username to put us in `players[playerId]`.
      // Without this, SIT_DOWN / LEAVE_TABLE / etc. cannot find the player.
      socket.emit("FETCH_LOBBY_INFO", uname);
    });

    socket.on("RECEIVE_LOBBY_INFO", () => {
      pushToast("Lobby registered — joining table...");
      if (joinedTableIdGlobal) socket.emit("JOIN_TABLE", joinedTableIdGlobal);
    });
    socket.on("disconnect", () => {
      dispatch({ type: "CONNECTED", value: false });
      pushToast("Disconnected", "warn");
    });
    socket.on("connect_error", (err) => pushToast(`Connect error: ${err.message}`, "error"));

    socket.on("TABLE_UPDATED", ({ table }) => dispatch({ type: "TABLE_SNAPSHOT", table }));
    socket.on("ACTION_SITTED", ({ seatId, message }) => {
      pushToast(message || `Seat ${seatId} taken`);
      socket.emit("GET_TABLE", { tableId });
    });
    socket.on("SEATS_UPDATE", ({ message }) => {
      pushToast(message || "Seat updated");
      socket.emit("GET_TABLE", { tableId });
    });
    socket.on("SEAT_EXIT_TABLE", ({ message }) => {
      pushToast(message || "Player left seat");
      socket.emit("GET_TABLE", { tableId });
    });
    socket.on("PLAYERS_UPDATED", () => socket.emit("GET_TABLE", { tableId }));
    socket.on("NIU_PLAYER_SITOUT", ({ seatId, reason }) => {
      pushToast(`Seat ${seatId} sit-out (${reason})`);
      socket.emit("GET_TABLE", { tableId });
    });
    socket.on("NIU_PLAYER_KICKED", ({ seatId, playerId: kickedPlayerId, reason, inactiveRounds }) => {
      const isMe = kickedPlayerId != null && String(kickedPlayerId) === String(playerId);
      if (reason === "INACTIVITY") {
        if (isMe) {
          const rounds = inactiveRounds ?? "a few";
          pushToast(
            `You were removed for inactivity (missed ${rounds} round${rounds === 1 ? "" : "s"}). Re-join the table to play again.`,
            "warn",
          );
          // Drop back to the connect screen so the user can re-join cleanly.
          joinedTableIdGlobal = null;
          dispatch({ type: "FULL_RESET" });
          setJoinedTableId(null);
        } else {
          pushToast(`Seat ${seatId} kicked for inactivity`);
        }
      } else {
        pushToast(`Seat ${seatId} kicked (${reason})`);
      }
      socket.emit("GET_TABLE", { tableId });
    });

    socket.on("NIU_ROUND_WAIT_START", ({ waitMs }) => dispatch({ type: "WAIT_COUNTDOWN", waitMs }));
    socket.on("NIU_WAITING_FOR_PLAYERS", ({ message, eligibleCount, minPlayers }) => {
      dispatch({ type: "CANCEL_COUNTDOWN" });
      dispatch({ type: "STATUS", text: `${message} (${eligibleCount}/${minPlayers})` });
    });
    socket.on("NIU_ROUND_START", ({ roundId }) => dispatch({ type: "ROUND_BEGIN", roundId }));
    socket.on("NIU_ROUND_END", () => dispatch({ type: "ROUND_END" }));

    socket.on("NIU_CARDS_DEALT", ({ cards, suggestedTop, suggestedBottom }) => {
      dispatch({ type: "MY_CARDS", cards: cards || [], suggestion: { top: suggestedTop || [], bottom: suggestedBottom || [] } });
    });
    socket.on("NIU_SUGGEST_RESULT", ({ top, bottom, result }) => {
      dispatch({ type: "SUGGEST_HINT", top, bottom });
      pushToast(`Suggested: ${result?.label || "?"} (${result?.multiplier || 1}x)`);
    });

    socket.on("NIU_TURN_STARTED", ({ seatId, timerMs, isInstantSpecial, specialPreview }) => {
      dispatch({ type: "TURN", seatId, timerMs });
      if (isInstantSpecial && specialPreview) {
        pushToast(`Instant special: ${specialPreview.label}`);
      }
    });
    socket.on("NIU_TURN_TIMEOUT", ({ seatId }) => {
      dispatch({ type: "TURN_TIMEOUT" });
      pushToast(`Seat ${seatId} timed out — auto-arranging`);
    });
    socket.on("NIU_ARRANGE_CONFIRM", ({ seatId, topHand, bottomHand, result, autoArranged, fromSuggest }) => {
      dispatch({ type: "OPPONENT_REVEAL", seatId, topHand, bottomHand, result, autoArranged, fromSuggest });
    });

    socket.on("NIU_HAND_EVALUATED", ({ seatId, result }) => dispatch({ type: "EVAL", seatId, result }));
    socket.on("NIU_WINNER_DETERMINED", ({ winners, isPush }) => dispatch({ type: "WINNERS", winners, isPush }));
    socket.on("NIU_RESULT_REVEAL", ({ winningHand, revealMs }) => {
      dispatch({ type: "REVEAL_BANNER", winningHand });
      // Hold the winner banner longer than the server-reported revealMs (2s)
      // so players have time to read the outcome. Total ≈ 8s.
      setTimeout(() => dispatch({ type: "HIDE_BANNER" }), (revealMs || 2000) + 6000);
    });
    socket.on("NIU_SETTLEMENT", (payload) => {
      dispatch({ type: "SETTLEMENT", payload });
      const me = (payload.winnerCredits || []).find((w) => String(w.playerId) === String(playerId));
      const lost = (payload.loserDebits || []).find((l) => String(l.playerId) === String(playerId));
      if (me) pushToast(`You won +${me.amount}`);
      else if (lost) pushToast(`You lost -${lost.amount}`, "warn");
      else if (payload.isPush) pushToast("Push round — no winners");
      // Spawn animation (chips fly loser → winner, stacks roll)
      setTimeout(() => runSettlementAnimation(payload), 50);
    });

    socket.on("NIU_CHIPS_UPDATE", ({ balance, delta, source, seatId }) => {
      dispatch({ type: "MY_BALANCE", balance });
      console.log(`💰 NIU_CHIPS_UPDATE balance=${balance} delta=${delta} source=${source}`);
      if (delta != null && delta !== 0) {
        // Show floating +/- on my seat if known, else over the balance pill.
        const targetSeatId = seatId ?? state.mySeatId;
        spawnFloatingDeltaAt(targetSeatId, delta, delta > 0 ? "win" : "loss");
      }
      // Trigger a stack tween for my seat toward the new balance.
      if (seatId != null) {
        tweenStack(Number(seatId), balance, 1200);
      }
    });

    socket.on("NIU_BALANCE_LOW", ({ balance, minBuyIn, message }) => {
      dispatch({ type: "SHOW_TOPUP", info: { balance, minBuyIn, message } });
    });
    socket.on("GAME_ERROR", ({ reason, minBuyIn }) => {
      pushToast(`Error: ${reason}${minBuyIn ? ` (min ${minBuyIn})` : ""}`, "error");
      if (reason && reason.toLowerCase().includes("insufficient")) {
        dispatch({ type: "SHOW_TOPUP", info: { minBuyIn, message: reason } });
      }
    });
  };

  const joinTable = () => {
    if (!playerId.trim()) {
      pushToast("Enter Player ID first", "error");
      return;
    }
    joinedTableIdGlobal = tableId;
    setJoinedTableId(tableId);
    pushToast(`Joining ${tableId}...`);
    if (!socket) {
      connect();
      // JOIN_TABLE is emitted in the RECEIVE_LOBBY_INFO handler after registration.
    } else if (socket.connected) {
      socket.emit("FETCH_LOBBY_INFO", username.trim() || `Player_${playerId.trim()}`);
    }
  };

  const refreshTable = () => socket?.emit("GET_TABLE", { tableId });

  const sitDown = (seatId) => {
    if (!seatId) return pushToast("Pick a seat first", "warn");
    if (!socket) return pushToast("Not connected", "error");
    // Niu Bull: server reads chips from Redis — no `amount` needed.
    socket.emit("SIT_DOWN", {
      tableId,
      seatId: Number(seatId),
    });
  };

  const leaveTable = () => {
    socket?.emit("LEAVE_TABLE", tableId);
    joinedTableIdGlobal = null;
    dispatch({ type: "FULL_RESET" });
    setJoinedTableId(null);
  };

  const sittingOut = () => socket?.emit("SITTING_OUT", { tableId });
  const sittingIn = () => socket?.emit("SITTING_IN", { tableId });

  const topUp = () => {
    const amt = Number(topUpAmount);
    if (!amt || amt <= 0) return pushToast("Top up amount must be > 0", "warn");
    socket?.emit("PLAYER_CHIP_TOP_UP", { tableId, amount: amt });
    dispatch({ type: "HIDE_TOPUP" });
  };

  const requestSuggest = () => socket?.emit("NIU_REQUEST_SUGGEST", { tableId });

  const confirmArrange = () => {
    if (state.topSlot.length !== 2) return pushToast("Top must be exactly 2 cards", "warn");
    if (state.bottomSlot.length !== 3) return pushToast("Bottom must be exactly 3 cards", "warn");
    socket?.emit("NIU_CONFIRM_ARRANGE", {
      tableId,
      topHand: state.topSlot,
      bottomHand: state.bottomSlot,
      fromSuggest: state.usedSuggest,
    });
  };

  const acceptSuggestion = () => {
    if (!state.suggestion) return pushToast("No suggestion available", "warn");
    dispatch({ type: "ACCEPT_SUGGEST" });
  };

  // Unmount-only cleanup. Never re-run on prop/state change or the socket
  // would be killed mid-flow and every subsequent emit would silently fail.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      if (socket) {
        try {
          if (joinedTableIdGlobal) socket.emit("LEAVE_TABLE", joinedTableIdGlobal);
        } catch (_) {}
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        joinedTableIdGlobal = null;
      }
    };
  }, []);

  const myTurn = state.currentTurnSeatId != null && state.currentTurnSeatId === state.mySeatId;
  const arranging = state.phase === "ARRANGING";
  const seats = state.table?.seats || {};
  const seatIds = Object.keys(seats).map((n) => Number(n)).sort((a, b) => a - b);
  const maxSeats = state.table?.maxPlayers || (seatIds.length || 6);
  const renderSeatIds = seatIds.length ? seatIds : Array.from({ length: maxSeats }, (_, i) => i + 1);

  const handLeftovers = state.myCards.filter(
    (c) => !isCardInList(c, state.topSlot) && !isCardInList(c, state.bottomSlot)
  );

  const suggestedTop = state.suggestion?.top || [];
  const suggestedBottom = state.suggestion?.bottom || [];

  return (
    <div className="nb-root">
      <header className="nb-header">
        <h1>Niu Bull (PokerHot Niuniu)</h1>
        <div className="nb-conn">
          <span className={`nb-dot ${state.connected ? "on" : "off"}`} />
          {state.connected ? "Connected" : "Disconnected"} · {SOCKET_URL}
        </div>
      </header>

      {!joinedTableId && (
        <section className="nb-panel">
          <h2>Connect & Join</h2>
          <div className="nb-form-grid">
            <label>
              Table ID
              <input value={tableId} onChange={(e) => setTableId(e.target.value)} placeholder="T-001" />
            </label>
            <label>
              Player ID (required, sent as ?playerId=)
              <input value={playerId} onChange={(e) => setPlayerId(e.target.value)} placeholder="e.g. 101" />
            </label>
            <label>
              Username (for FETCH_LOBBY_INFO)
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. Alice" />
            </label>
          </div>
          <div className="nb-hint">
            Niu Bull reads your chips from Redis (defaults to 100 on first connect). No buy-in is sent at sit-down.
          </div>
          <div className="nb-row">
            <button className="nb-btn primary" onClick={joinTable}>
              Connect & Join Table
            </button>
          </div>
        </section>
      )}

      {joinedTableId && (
        <>
          <section className="nb-status">
            <div className="nb-status-row">
              <div className="nb-phase">Phase: <b>{state.phase}</b></div>
              <div>Round: <b>{state.roundId || "—"}</b></div>
              <div>My Seat: <b>{state.mySeatId ?? "Observer"}</b></div>
              <div>Acting: <b>{state.currentTurnSeatId ?? "—"}</b></div>
              <div className="nb-mychips">
                💰 Chips: <b>{state.myBalance ?? "—"}</b>
              </div>
            </div>
            {state.statusBanner && <div className="nb-banner info">{state.statusBanner}</div>}
            {state.phase === "WAITING" && waitRemaining > 0 && (
              <div className="nb-banner wait">Round starts in {fmtTime(waitRemaining)}</div>
            )}
            {arranging && state.currentTurnSeatId != null && (
              <div className={`nb-banner turn ${myTurn ? "mine" : ""}`}>
                {myTurn ? "YOUR TURN" : `Seat ${state.currentTurnSeatId} acting`} · {fmtTime(turnRemaining)}
              </div>
            )}
            {state.showWinnerBanner && state.winningHand && (
              <div className="nb-banner winner">
                {state.isPush
                  ? "Push round — no winners"
                  : `Winner: ${state.winners.map((w) => `Seat ${w.seatId}`).join(", ")} with ${state.winningHand.label} (${state.winningHand.multiplier}x)`}
              </div>
            )}
          </section>

          <section className="nb-table">
            <h2>Seats</h2>
            <div className="nb-seats">
              {renderSeatIds.map((sid) => {
                const seat = seats[sid] || null;
                const isMine = state.mySeatId === sid;
                const isTurn = state.currentTurnSeatId === sid;
                const revealed = state.revealedHands[sid];
                return (
                  <SeatBox
                    key={sid}
                    seatId={sid}
                    seat={seat}
                    isMine={isMine}
                    isTurn={isTurn}
                    revealed={revealed}
                    displayedStack={state.displayedStacks[sid]}
                  />
                );
              })}
            </div>
          </section>

          <section className="nb-actions">
            <div className="nb-row">
              <label>
                Seat:
                <select value={pickedSeat} onChange={(e) => setPickedSeat(e.target.value)}>
                  <option value="">—</option>
                  {renderSeatIds
                    .filter((sid) => !seats[sid])
                    .map((sid) => (
                      <option key={sid} value={sid}>
                        Seat {sid}
                      </option>
                    ))}
                </select>
              </label>
              <button
                className="nb-btn"
                onClick={() => sitDown(pickedSeat)}
                disabled={state.mySeatId != null || !pickedSeat}
              >
                Sit Down
              </button>
              <button className="nb-btn" onClick={sittingOut} disabled={state.mySeatId == null}>
                Sit Out
              </button>
              <button className="nb-btn" onClick={sittingIn} disabled={state.mySeatId == null}>
                Sit In
              </button>
              <button className="nb-btn warn" onClick={leaveTable}>
                Leave Table
              </button>
              <button className="nb-btn" onClick={refreshTable}>
                Refresh
              </button>
            </div>
          </section>

          {state.mySeatId != null && state.myCards.length > 0 && (
            <section className="nb-arrange">
              <h2>Your Hand — Arrange (Top: 2, Bottom: 3)</h2>

              <div className="nb-slot-row">
                <div className="nb-slot">
                  <div className="nb-slot-title">Top ({state.topSlot.length}/2)</div>
                  <div className="nb-slot-cards">
                    {state.topSlot.length === 0 && <span className="nb-slot-empty">click cards from hand →</span>}
                    {state.topSlot.map((c, i) => (
                      <CardView
                        key={`top-${i}`}
                        card={c}
                        onClick={() => dispatch({ type: "REMOVE_FROM_SLOTS", card: c })}
                      />
                    ))}
                  </div>
                </div>

                <div className="nb-slot">
                  <div className="nb-slot-title">Bottom ({state.bottomSlot.length}/3)</div>
                  <div className="nb-slot-cards">
                    {state.bottomSlot.length === 0 && <span className="nb-slot-empty">click cards from hand →</span>}
                    {state.bottomSlot.map((c, i) => (
                      <CardView
                        key={`bot-${i}`}
                        card={c}
                        onClick={() => dispatch({ type: "REMOVE_FROM_SLOTS", card: c })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="nb-hand">
                <div className="nb-hand-title">Hand</div>
                <div className="nb-hand-cards">
                  {handLeftovers.length === 0 ? (
                    <span className="nb-slot-empty">all cards placed</span>
                  ) : (
                    handLeftovers.map((c, i) => {
                      const inTopSuggest = isCardInList(c, suggestedTop);
                      const inBotSuggest = isCardInList(c, suggestedBottom);
                      return (
                        <div key={`hand-${i}`} className="nb-hand-card">
                          <CardView card={c} highlighted={inTopSuggest || inBotSuggest} onClick={() => {}} />
                          <div className="nb-card-actions">
                            <button
                              className="nb-btn tiny"
                              disabled={state.topSlot.length >= 2}
                              onClick={() => dispatch({ type: "MOVE_CARD_TO_TOP", card: c })}
                            >
                              → Top {inTopSuggest ? "★" : ""}
                            </button>
                            <button
                              className="nb-btn tiny"
                              disabled={state.bottomSlot.length >= 3}
                              onClick={() => dispatch({ type: "MOVE_CARD_TO_BOTTOM", card: c })}
                            >
                              → Bot {inBotSuggest ? "★" : ""}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="nb-row">
                <button
                  className="nb-btn"
                  onClick={requestSuggest}
                  disabled={!arranging || !myTurn}
                  title="Ask server for best split"
                >
                  💡 Suggest
                </button>
                <button
                  className="nb-btn"
                  onClick={acceptSuggestion}
                  disabled={!state.suggestion}
                  title="Auto-fill with suggested split"
                >
                  Accept Suggestion
                </button>
                <button
                  className="nb-btn"
                  onClick={() => dispatch({ type: "RESET_ARRANGEMENT" })}
                  disabled={state.topSlot.length === 0 && state.bottomSlot.length === 0}
                >
                  Reset
                </button>
                <button
                  className="nb-btn primary"
                  onClick={confirmArrange}
                  disabled={!arranging || !myTurn || state.topSlot.length !== 2 || state.bottomSlot.length !== 3}
                >
                  ✅ Confirm Arrangement
                </button>
              </div>

              {state.suggestion && (
                <div className="nb-suggest-hint">
                  Server suggested split — ★ marks suggested cards.
                </div>
              )}
            </section>
          )}

          {state.lastSettlement && (
            <section className="nb-panel">
              <h2>Last Settlement</h2>
              <div className="nb-settle-row">
                <div>Pot: <b>{state.lastSettlement.pot ?? 0}</b></div>
                <div>Rake: <b>{state.lastSettlement.rake ?? 0}</b></div>
                <div>Push: <b>{String(state.lastSettlement.isPush)}</b></div>
              </div>
              <div className="nb-settle-cols">
                <div>
                  <h4>Winners</h4>
                  {(state.lastSettlement.winnerCredits || []).map((w) => (
                    <div key={w.txId} className="nb-credit">
                      Seat {w.seatId}: <b>+{w.amount}</b> ({w.type})
                    </div>
                  ))}
                </div>
                <div>
                  <h4>Losers</h4>
                  {(state.lastSettlement.loserDebits || []).map((l) => (
                    <div key={l.txId} className="nb-debit">
                      Seat {l.seatId}: <b>-{l.amount}</b> ({l.type})
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {state.showTopUpModal && (
        <div className="nb-modal-back">
          <div className="nb-modal">
            <h3>Top Up Required</h3>
            <p>{state.topUpInfo?.message || "Your balance is below the table minimum."}</p>
            {state.topUpInfo?.balance != null && (
              <p>
                Balance: <b>{state.topUpInfo.balance}</b> · Min Buy-In: <b>{state.topUpInfo.minBuyIn}</b>
              </p>
            )}
            <div className="nb-row">
              <label>
                Amount
                <input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} min={1} />
              </label>
              <button className="nb-btn primary" onClick={topUp}>
                Top Up
              </button>
              <button className="nb-btn" onClick={() => dispatch({ type: "HIDE_TOPUP" })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nb-toasts">
        {state.toasts.map((t) => (
          <div key={t.id} className={`nb-toast ${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>

      {/* FX overlay — flying chips + floating delta text */}
      <div className="nb-fx-overlay" aria-hidden>
        {state.flyingChips.map((c) => (
          <div
            key={c.id}
            className="nb-flying-chip"
            style={{
              left: `${c.fromX}px`,
              top: `${c.fromY}px`,
              "--dx": `${c.dx}px`,
              "--dy": `${c.dy}px`,
            }}
          />
        ))}
        {state.floatingDeltas.map((d) => (
          <div
            key={d.id}
            className={`nb-floating-delta ${d.kind}`}
            style={{ left: `${d.x}px`, top: `${d.y}px` }}
          >
            {d.amount > 0 ? `+${d.amount}` : `${d.amount}`}
          </div>
        ))}
      </div>
    </div>
  );
}
