import React from 'react';

const COIN_VALUES = [0.1, 0.2, 0.5, 1, 2, 5, 10];

export default function BetControls({
  coinValue,
  setCoinValue,
  onSpin,
  onOpenBuyBonus,
  onToggleAnte,
  anteBet,
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
    <div className="cg-controls">
      <div className="cg-bet-block">
        <label className="cg-label">Total Bet</label>
        <div className="cg-bet-row">
          <button
            className="cg-bet-btn"
            disabled={!canChangeBet}
            onClick={() => {
              const idx = COIN_VALUES.indexOf(coinValue);
              if (idx > 0) setCoinValue(COIN_VALUES[idx - 1]);
            }}
          >−</button>
          <div className="cg-bet-value">
            € {(coinValue * (anteBet ? 1.25 : 1)).toFixed(2)}
            {anteBet && <div className="cg-ante-tag">ANTE ×1.25</div>}
          </div>
          <button
            className="cg-bet-btn"
            disabled={!canChangeBet}
            onClick={() => {
              const idx = COIN_VALUES.indexOf(coinValue);
              if (idx < COIN_VALUES.length - 1) setCoinValue(COIN_VALUES[idx + 1]);
            }}
          >+</button>
        </div>
      </div>

      <button
        className={`cg-spin-btn ${spinning ? 'cg-spinning-btn' : ''} ${freeSpinsActive ? 'cg-fs' : ''}`}
        onClick={onSpin}
        disabled={disabled || spinning || autoplayActive}
        title={freeSpinsActive ? 'Free Spin' : 'Spin'}
      >
        <div className="cg-spin-btn-inner">
          {spinning ? '⟳' : freeSpinsActive ? 'FS' : 'SPIN'}
        </div>
      </button>

      <div className="cg-side-actions">
        <button
          className="cg-mini-btn cg-buy"
          onClick={onOpenBuyBonus}
          disabled={spinning || autoplayActive || freeSpinsActive}
        >
          <div className="cg-buy-icon">🌟</div>
          <div>BUY BONUS</div>
          <small>100× bet</small>
        </button>
        <button
          className={`cg-mini-btn cg-ante ${anteBet ? 'cg-ante-on' : ''}`}
          onClick={onToggleAnte}
          disabled={spinning || autoplayActive || freeSpinsActive}
        >
          <div>ANTE BET</div>
          <small>{anteBet ? 'ON — 2× scatter chance' : 'OFF'}</small>
        </button>
        {!autoplayActive ? (
          <button
            className="cg-mini-btn cg-auto"
            onClick={() => onStartAutoplay(10)}
            disabled={spinning || freeSpinsActive}
          >
            <div>AUTO</div>
            <small>10 rounds</small>
          </button>
        ) : (
          <button className="cg-mini-btn cg-stop" onClick={onCancelAutoplay}>
            <div>STOP</div>
            <small>{autoplayRemaining} left</small>
          </button>
        )}
      </div>
    </div>
  );
}
