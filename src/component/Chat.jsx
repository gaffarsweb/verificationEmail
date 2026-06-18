// Chat.jsx — slide-in chat panel for NiuBullGame.
// Web counterpart of src/components/inGame/chat.js (React Native).
// Features mirror the Lucky Six / Bull-Bull pattern:
//   • predefined messages popup (•‧• icon)
//   • @mention popup keyed off the seated players list
//   • text input + send
// Voice recording is intentionally omitted (no RN native module on web).
import React, { useEffect, useMemo, useRef, useState } from "react";

const PRESET_MESSAGES = [
  "Money won is twice as sweet as money earned.",
  "Fold and live to fold again!",
  "You call, it's gonna be all over baby!",
  "Tight is not right!",
  "May the flop be with you!",
  "Poker is 100% skill and 50% luck.",
  "No river, no fish!",
  "Poker is war. People pretend it is a game!",
  "Ship it!",
  "Nice hand, bro!",
  "Just play every hand, you can't miss them all.",
];

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

const initials = (name = "") =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

export default function Chat({
  open,
  onClose,
  messages,
  onSend,
  onLoadMore,
  isFetching,
  myUserId,
  myUsername,
  currentPlayers,
  onOpenPlayerProfile,
  initialMention,
}) {
  const [input, setInput] = useState("");
  const [presetVisible, setPresetVisible] = useState(false);
  const [mentionVisible, setMentionVisible] = useState(false);
  const listRef = useRef(null);

  // If the parent passes an `initialMention` (set when a player profile's
  // "Send Message" button is tapped), pre-fill the input with @Name.
  useEffect(() => {
    if (initialMention) {
      setInput((prev) => {
        const tag = `@${initialMention} `;
        return prev.includes(tag) ? prev : prev + tag;
      });
    }
  }, [initialMention]);

  // Auto-scroll to the newest message when the list changes.
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = 0; // list is inverted via flex-direction
  }, [messages]);

  const sortedMessages = useMemo(() => {
    return [...(messages || [])].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [messages]);

  const send = (text, isPreset = false) => {
    const msg = (text || "").trim();
    if (!msg) return;
    onSend?.({ type: "text", message: msg });
    if (!isPreset) setInput("");
    if (isPreset) setPresetVisible(false);
  };

  const insertMention = (name) => {
    if (!name) return;
    setInput((prev) => {
      const tag = `@${name} `;
      // Cap at 3 mentions of the same name (same rule as RN chat.js).
      const count = (prev.match(new RegExp(`@${name}\\b`, "gi")) || []).length;
      if (count >= 3) return prev;
      return prev + tag;
    });
    setMentionVisible(false);
  };

  if (!open) return null;

  return (
    <div className="nb-chat-back" onMouseDown={onClose}>
      <aside
        className="nb-chat-panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="nb-chat-head">
          <span>Table Chat</span>
          <button className="nb-chat-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="nb-chat-list" ref={listRef}>
          {sortedMessages.length === 0 && (
            <div className="nb-chat-empty">No messages yet — say hi 👋</div>
          )}
          {sortedMessages.map((m, idx) => {
            const isMe = String(m.userId) === String(myUserId);
            const next = sortedMessages[idx + 1]; // (inverted: "next" = older)
            const sameUser = next && String(next.userId) === String(m.userId);
            return (
              <div
                key={m._id || `${m.userId}-${m.createdAt}-${idx}`}
                className={`nb-chat-row ${isMe ? "me" : "other"}`}
              >
                {!isMe && !sameUser && (
                  <div className="nb-chat-author">
                    <button
                      type="button"
                      className="nb-chat-ava"
                      onClick={() =>
                        onOpenPlayerProfile?.({
                          id: m.userId,
                          name: m.name,
                          profilePic: m.profilePic,
                        })
                      }
                      title="View profile"
                    >
                      {m.profilePic ? (
                        <img src={m.profilePic} alt={m.name || ""} />
                      ) : (
                        <span>{initials(m.name)}</span>
                      )}
                    </button>
                    <span className="nb-chat-name">{m.name || `P${m.userId}`}</span>
                  </div>
                )}
                <div className="nb-chat-bubble">
                  <div className="nb-chat-text">{m.message}</div>
                  <div className="nb-chat-time">{fmtTime(m.createdAt)}</div>
                </div>
              </div>
            );
          })}
          {isFetching && <div className="nb-chat-empty">Loading…</div>}
          {onLoadMore && sortedMessages.length > 0 && (
            <button
              type="button"
              className="nb-chat-more"
              onClick={onLoadMore}
              disabled={isFetching}
            >
              Load older
            </button>
          )}
        </div>

        <div className="nb-chat-bar">
          <div className="nb-chat-input-wrap">
            <input
              className="nb-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here…"
              maxLength={150}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button
              type="button"
              className={`nb-chat-at ${mentionVisible ? "on" : ""}`}
              onClick={() => {
                setMentionVisible((v) => !v);
                setPresetVisible(false);
              }}
              title="@mention a player"
            >
              @
            </button>
          </div>

          <button
            type="button"
            className="nb-chat-preset-btn"
            onClick={() => {
              setPresetVisible((v) => !v);
              setMentionVisible(false);
            }}
            title="Quick messages"
          >
            💬
          </button>
          <button
            type="button"
            className="nb-chat-send"
            onClick={() => send(input)}
            disabled={!input.trim()}
            title="Send"
          >
            ➤
          </button>
        </div>

        {presetVisible && (
          <div
            className="nb-chat-popover preset"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {PRESET_MESSAGES.map((m, i) => (
              <button
                key={i}
                type="button"
                className="nb-chat-popover-row"
                onClick={() => send(m, true)}
              >
                <span>• {m}</span>
                <span className="nb-chat-popover-send">➤</span>
              </button>
            ))}
          </div>
        )}

        {mentionVisible && (
          <div
            className="nb-chat-popover mention"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {(currentPlayers || []).length === 0 && (
              <div className="nb-chat-popover-empty">No other players</div>
            )}
            {(currentPlayers || [])
              .filter((p) => String(p.id) !== String(myUserId))
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="nb-chat-popover-row"
                  onClick={() => insertMention(p.displayName || p.name)}
                >
                  <span>@{p.displayName || p.name}</span>
                </button>
              ))}
          </div>
        )}
      </aside>
    </div>
  );
}
