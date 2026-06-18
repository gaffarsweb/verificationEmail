// PlayerProfileModal.jsx — popup shown when you click another player's seat.
// Same flow as the Lucky Six / Bull-Bull pattern: read-only player card with
// a "Send Message" button that opens the chat panel pre-filled with @Name.
import React from "react";

const initials = (name = "") =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

export default function PlayerProfileModal({
  player,
  onClose,
  onSendMessage,
  onSendSticker,
}) {
  if (!player) return null;
  const name = player.displayName || player.name || `P${player.id}`;
  return (
    <div className="nb-profile-back" onMouseDown={onClose}>
      <div
        className="nb-profile-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="nb-profile-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="nb-profile-ava">
          {player.profilePic ? (
            <img src={player.profilePic} alt={name} />
          ) : (
            <span>{initials(name)}</span>
          )}
        </div>
        <div className="nb-profile-name">{name}</div>
        {player.id != null && (
          <div className="nb-profile-meta">ID: {player.id}</div>
        )}
        {player.stack != null && (
          <div className="nb-profile-meta">
            Stack: <b>{player.stack}</b>
          </div>
        )}
        {player.seatId != null && (
          <div className="nb-profile-meta">Seat {player.seatId}</div>
        )}
        <div className="nb-profile-actions">
          <button
            className="nb-btn primary"
            onClick={() => {
              onSendMessage?.(name);
              onClose?.();
            }}
          >
            💬 Send Message
          </button>
          {onSendSticker && (
            <button
              className="nb-btn"
              onClick={() => {
                onSendSticker?.(player);
                onClose?.();
              }}
            >
              🎁 Send Sticker
            </button>
          )}
          <button className="nb-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
