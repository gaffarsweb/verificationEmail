// StickerPicker.jsx — modal that lists OFX sticker categories and stickers
// for the user to send. Same data shape as the RN PlayerProfileModal sticker
// grid (categories[].stickers[].{id, imageUrl, gifUrl, stickerKey, ...}).
//
// `type` is "own" (sending to my own seat — celebrate) or "opponent" (sending
// to another player). The picker hides itself after a selection so the parent
// can run the flying-sticker animation.
import React, { useMemo, useState } from "react";

// Tiny built-in fallback set so the picker is still usable even when the
// auth-server categories API is unreachable (e.g. local dev with no token).
// Each entry is an emoji that StickerOverlay can render directly.
const FALLBACK = [
  {
    id: "f-emotes",
    categoryName: "Emotes",
    categoryKey: "emotes",
    stickers: [
      { id: "e1", emoji: "👍" },
      { id: "e2", emoji: "👏" },
      { id: "e3", emoji: "🔥" },
      { id: "e4", emoji: "😂" },
      { id: "e5", emoji: "🤯" },
      { id: "e6", emoji: "🙏" },
      { id: "e7", emoji: "💯" },
      { id: "e8", emoji: "🥳" },
      { id: "e9", emoji: "🎉" },
      { id: "e10", emoji: "🤝" },
      { id: "e11", emoji: "🤔" },
      { id: "e12", emoji: "😎" },
    ],
  },
  {
    id: "f-bull",
    categoryName: "Bull-Bull",
    categoryKey: "bull",
    stickers: [
      { id: "b1", emoji: "🐂" },
      { id: "b2", emoji: "🐮" },
      { id: "b3", emoji: "🃏" },
      { id: "b4", emoji: "♠️" },
      { id: "b5", emoji: "♥️" },
      { id: "b6", emoji: "♦️" },
      { id: "b7", emoji: "♣️" },
      { id: "b8", emoji: "💰" },
    ],
  },
];

export default function StickerPicker({
  open,
  type, // "own" | "opponent"
  targetSeatId,
  targetName,
  categories, // [{ id, categoryName, stickers: [...] }]
  onClose,
  onPick,
}) {
  const [activeCat, setActiveCat] = useState(0);

  const list = useMemo(() => {
    const remote = (categories || []).filter(
      (c) => Array.isArray(c.stickers) && c.stickers.length
    );
    return remote.length ? remote : FALLBACK;
  }, [categories]);

  if (!open) return null;

  const safeIdx = Math.min(activeCat, list.length - 1);
  const cat = list[safeIdx];

  return (
    <div className="nb-stk-back" onMouseDown={onClose}>
      <div
        className="nb-stk-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="nb-stk-head">
          <span>
            {type === "own"
              ? "Send to yourself"
              : `Send sticker → ${targetName || `Seat ${targetSeatId}`}`}
          </span>
          <button className="nb-chat-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <nav className="nb-stk-tabs">
          {list.map((c, i) => (
            <button
              key={c.id || c.categoryKey || i}
              className={`nb-stk-tab ${i === safeIdx ? "on" : ""}`}
              onClick={() => setActiveCat(i)}
              type="button"
            >
              {c.categoryName || c.categoryKey || `Cat ${i + 1}`}
            </button>
          ))}
        </nav>

        <div className="nb-stk-grid">
          {(cat?.stickers || []).map((s) => (
            <button
              key={s.id}
              type="button"
              className="nb-stk-cell"
              title={s.stickerKey || s.name || ""}
              onClick={() =>
                onPick?.({
                  ...s,
                  categoryKey: s.categoryKey || cat?.categoryKey,
                  fallbackEmoji: s.emoji,
                })
              }
            >
              {s.imageUrl || s.gifUrl ? (
                <img
                  src={s.imageUrl || s.gifUrl}
                  alt={s.stickerKey || ""}
                  draggable={false}
                />
              ) : (
                <span className="nb-stk-cell-emoji">{s.emoji || "🎉"}</span>
              )}
            </button>
          ))}
          {(!cat?.stickers || cat.stickers.length === 0) && (
            <div className="nb-stk-empty">No stickers in this category</div>
          )}
        </div>
      </div>
    </div>
  );
}
