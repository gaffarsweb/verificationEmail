import React from 'react';

const COIN_VALUES = [0.1, 0.2, 0.5, 1, 2, 5, 10];

export default function BetControls({
  coinValue,
  setCoinValue,
  onSpin,
  onOpenBuyBonus,
  onStartAutoplay,
  onCancelAutoplay,
  spinning,
  autoplayActive,
  autoplayRemaining,
  freeSpinsActive,
  disabled,
}) {
  const canChangeBet = !spinning && !autoplayActive && !freeSpinsActive;

  return (
    <div className="dh-controls">
      <div className="dh-bet-block">
        <label className="dh-label">Coin Value</label>
        <div className="dh-bet-row">
          <button
            className="dh-bet-btn"
            disabled={!canChangeBet}
            onClick={() => {
              const idx = COIN_VALUES.indexOf(coinValue);
              if (idx > 0) setCoinValue(COIN_VALUES[idx - 1]);
            }}
          >−</button>
          <div className="dh-bet-value">€ {coinValue.toFixed(2)}</div>
          <button
            className="dh-bet-btn"
            disabled={!canChangeBet}
            onClick={() => {
              const idx = COIN_VALUES.indexOf(coinValue);
              if (idx < COIN_VALUES.length - 1) setCoinValue(COIN_VALUES[idx + 1]);
            }}
          >+</button>
        </div>
      </div>

      <button
        className={`dh-spin-btn ${spinning ? 'dh-spinning-btn' : ''} ${freeSpinsActive ? 'dh-fs' : ''}`}
        onClick={onSpin}
        disabled={disabled || spinning || autoplayActive}
        title={freeSpinsActive ? 'Free Spin' : 'Spin'}
      >
        {spinning ? '⟳' : freeSpinsActive ? 'FS' : 'SPIN'}
      </button>

      <div className="dh-side-actions">
        <button
          className="dh-mini-btn dh-buy"
          onClick={onOpenBuyBonus}
          disabled={spinning || autoplayActive || freeSpinsActive}
        >
          Buy Bonus
        </button>
        {!autoplayActive ? (
          <button
            className="dh-mini-btn dh-auto"
            onClick={() => onStartAutoplay(10)}
            disabled={spinning || freeSpinsActive}
          >
            Autoplay 10
          </button>
        ) : (
          <button className="dh-mini-btn dh-stop" onClick={onCancelAutoplay}>
            Stop ({autoplayRemaining})
          </button>
        )}
      </div>
    </div>
  );
}
