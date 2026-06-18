// StickerOverlay.jsx — renders the in-flight stickers spawned by
// NiuBullGame's animateSticker(). Mirrors ofxStickerOverlay.js from the
// React Native app — same two-phase visual:
//   1. "traveling" : static imageUrl flies from sender's seat to target's
//   2. "playing"   : swap to the GIF for ~3s, then unmount
//
// CSS does the translate/scale animation; we just position the start point
// and let CSS variables drive the end translation.
import React from "react";

const STICKER_SIZE = 60;

export default function StickerOverlay({ stickers }) {
  if (!stickers || stickers.length === 0) return null;
  return (
    <div className="nb-sticker-layer" aria-hidden>
      {stickers.map((s) => (
        <StickerItem key={s.id} sticker={s} />
      ))}
    </div>
  );
}

function StickerItem({ sticker }) {
  const url =
    sticker.phase === "traveling"
      ? sticker.imageUrl || sticker.gifUrl
      : sticker.gifUrl || sticker.imageUrl;
  const style = {
    left: `${sticker.fromX - STICKER_SIZE / 2}px`,
    top: `${sticker.fromY - STICKER_SIZE / 2}px`,
    width: `${STICKER_SIZE}px`,
    height: `${STICKER_SIZE}px`,
    "--stk-dx": `${sticker.dx}px`,
    "--stk-dy": `${sticker.dy}px`,
  };
  return (
    <div
      className={`nb-sticker ${sticker.phase} ${sticker.isSelf ? "self" : ""}`}
      style={style}
    >
      {url ? (
        <img src={url} alt="sticker" draggable={false} />
      ) : (
        <span className="nb-sticker-emoji">{sticker.fallbackEmoji || "🎉"}</span>
      )}
    </div>
  );
}
