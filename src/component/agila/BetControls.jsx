import React from 'react';
import { motion } from 'framer-motion';
import { AG_BET_SIZES, AG_BET_LEVELS } from './symbols';

/**
 * Bottom control bar — matches Jili original:
 * [TURBO] [BALANCE] --- [SPIN big] --- [BET AREA] [AUTO]
 */
export default function BetControls({
  betSize,
  setBetSize,
  betLevel,
  setBetLevel,
  balance,
  onSpin,
  onStartAutoplay,
  onCancelAutoplay,
  spinning,
  autoplayActive,
  autoplayRemaining,
  freeSpinsActive,
  turboMode,
  onToggleTurbo,
  disabled,
}) {
  const canChangeBet = !spinning && !autoplayActive && !freeSpinsActive;
  const totalBet = betSize * betLevel;

  const cycleBetSize = (delta) => {
    const idx = AG_BET_SIZES.indexOf(betSize);
    const next = idx + delta;
    if (next >= 0 && next < AG_BET_SIZES.length) setBetSize(AG_BET_SIZES[next]);
  };
  const cycleBetLevel = (delta) => {
    const idx = AG_BET_LEVELS.indexOf(betLevel);
    const next = idx + delta;
    if (next >= 0 && next < AG_BET_LEVELS.length) setBetLevel(AG_BET_LEVELS[next]);
  };

  return (
    <div className="ag-bottom-bar">
      {/* Left cluster: TURBO + BALANCE */}
      <div className="ag-bottom-left">
        <button
          className={`ag-pill ag-pill-turbo ${turboMode ? 'ag-turbo-on' : ''}`}
          onClick={onToggleTurbo}
          disabled={spinning || autoplayActive}
        >
          <div className="ag-pill-icon">⚡</div>
          <div className="ag-pill-label">TURBO</div>
        </button>

        <div className="ag-pill ag-pill-balance">
          <div className="ag-pill-label">BALANCE</div>
          <div className="ag-pill-value">{Number(balance || 0).toFixed(3)}</div>
        </div>
      </div>

      {/* Center: big golden spin button */}
      <motion.button
        className={`ag-spin-btn ${spinning ? 'ag-spinning-btn' : ''} ${freeSpinsActive ? 'ag-fs' : ''}`}
        onClick={onSpin}
        disabled={disabled || spinning || autoplayActive}
        whileTap={!disabled ? { scale: 0.92 } : {}}
        whileHover={!disabled ? { scale: 1.05 } : {}}
      >
        <div className="ag-spin-btn-glow" />
        <div className="ag-spin-btn-inner">
          <svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </div>
      </motion.button>

      {/* Right cluster: BET + AUTO */}
      <div className="ag-bottom-right">
        <div className="ag-pill ag-pill-bet">
          <button
            className="ag-bet-minmax"
            disabled={!canChangeBet}
            onClick={() => {
              if (betLevel > AG_BET_LEVELS[0]) cycleBetLevel(-1);
              else cycleBetSize(-1);
            }}
          >−</button>
          <div className="ag-pill-bet-inner">
            <div className="ag-pill-label">BET AREA</div>
            <div className="ag-pill-value">{totalBet.toFixed(2)}</div>
          </div>
          <button
            className="ag-bet-minmax"
            disabled={!canChangeBet}
            onClick={() => {
              if (betLevel < AG_BET_LEVELS[AG_BET_LEVELS.length - 1]) cycleBetLevel(1);
              else cycleBetSize(1);
            }}
          >+</button>
        </div>

        {!autoplayActive ? (
          <button
            className="ag-pill ag-pill-auto"
            onClick={() => onStartAutoplay(10)}
            disabled={spinning || freeSpinsActive}
          >
            <div className="ag-pill-icon">▶</div>
            <div className="ag-pill-label">AUTO</div>
          </button>
        ) : (
          <button className="ag-pill ag-pill-auto ag-pill-stop" onClick={onCancelAutoplay}>
            <div className="ag-pill-icon">■</div>
            <div className="ag-pill-label">STOP {autoplayRemaining}</div>
          </button>
        )}
      </div>
    </div>
  );
}
