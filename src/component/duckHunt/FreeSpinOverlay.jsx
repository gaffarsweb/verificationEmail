import React from 'react';

export default function FreeSpinOverlay({ active, remaining, total, totalWon, features }) {
  if (!active) return null;
  return (
    <div className="dh-fs-overlay">
      <div className="dh-fs-badge">
        <div className="dh-fs-title">FREE SPINS</div>
        <div className="dh-fs-count">{remaining} / {total}</div>
        <div className="dh-fs-won">Won: € {(totalWon || 0).toFixed(2)}</div>
        {features && features.length > 0 && (
          <div className="dh-fs-features">
            {features.map((f, i) => (
              <span key={i} className="dh-fs-feature">{f}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PickModal({ open, onPick }) {
  if (!open) return null;
  return (
    <div className="dh-modal-backdrop">
      <div className="dh-modal dh-pick-modal">
        <h2>Pick Your Feature</h2>
        <div className="dh-pick-options">
          <button className="dh-pick-btn dh-pick-1" onClick={() => onPick('FG_1')}>
            <div className="dh-pick-icon">🎯</div>
            <div>FG_1</div>
            <small>Duck Hunt Spins (7)</small>
          </button>
          <button className="dh-pick-btn dh-pick-2" onClick={() => onPick('FG_2')}>
            <div className="dh-pick-icon">🦅</div>
            <div>FG_2</div>
            <small>Hawk Eye Spins (8)</small>
          </button>
        </div>
      </div>
    </div>
  );
}

export function WinBanner({ amount, currency = '€' }) {
  if (!amount || amount <= 0) return null;
  const tier = amount > 50 ? 'mega' : amount > 10 ? 'big' : 'normal';
  return (
    <div className={`dh-win-banner dh-win-${tier}`}>
      <div className="dh-win-label">WIN</div>
      <div className="dh-win-amount">{currency} {amount.toFixed(2)}</div>
    </div>
  );
}
