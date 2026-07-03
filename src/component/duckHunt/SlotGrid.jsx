import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSymbol } from './symbols';

const REELS = 6;
const ROWS = 5;

const PHASE = {
  IDLE: 'idle',
  SPINNING: 'spinning',
  LANDING: 'landing',
  SHOWING: 'showing',
  TARGET_HIGHLIGHT: 'target_highlight',
  BLASTING: 'blasting',
  DROPPING: 'dropping',
  BOMB_ARMED: 'bomb_armed',
  BOMB_BURST: 'bomb_burst',
};

const TIMINGS = {
  spin: 550,
  landStagger: 90,
  postLand: 350,
  targetHighlight: 700,
  blast: 550,
  refill: 400,
  bombArm: 500,
  bombBurst: 700,
};

function emptyBoard() {
  return Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => null));
}

function cellKey(c, r) { return `${c}-${r}`; }

function getMultiplierMap(positionMultipliers = []) {
  const map = {};
  for (const pm of positionMultipliers) {
    if (!pm || !pm.position) continue;
    map[cellKey(pm.position.col, pm.position.row)] = pm.multiplier;
  }
  return map;
}

function getWinPositionSet(currentCountWin = []) {
  const set = new Set();
  for (const win of currentCountWin) {
    for (const pos of win.positions || []) set.add(cellKey(pos.col, pos.row));
  }
  return set;
}

function getBombSet(bombState) {
  const s = new Set();
  (bombState?.positions || []).forEach((p) => s.add(cellKey(p.col, p.row)));
  return s;
}

function getRemovedBySet(bombState) {
  const s = new Set();
  (bombState?.removedPositions || []).forEach((p) => s.add(cellKey(p.col, p.row)));
  return s;
}

/**
 * Cell — animates each symbol individually.
 * Drop-in from top, blast, refill, spin blur.
 */
function Cell({ symId, phase, colIdx, rowIdx, isWin, isBomb, isBombHit, multiplier, freeSpin }) {
  const sym = symId != null ? getSymbol(symId) : null;
  const bg = sym ? `linear-gradient(160deg, ${sym.color}55, ${sym.color}22)` : 'transparent';

  const animate = {};
  let transition = { duration: 0.35, ease: 'easeOut' };

  if (phase === PHASE.SPINNING) {
    animate.y = [-40, 400];
    animate.filter = ['blur(0px)', 'blur(3px)'];
    transition = { duration: 0.3, repeat: Infinity, ease: 'linear' };
  } else if (phase === PHASE.LANDING) {
    animate.y = [-160, 12, 0];
    animate.opacity = [0, 1, 1];
    animate.scale = [1.02, 1.08, 1];
    transition = { duration: 0.55, ease: [0.34, 1.56, 0.64, 1], delay: colIdx * 0.09 };
  } else if (phase === PHASE.TARGET_HIGHLIGHT && isWin) {
    animate.scale = [1, 1.14, 1.06];
    animate.filter = ['brightness(1)', 'brightness(1.8)', 'brightness(1.4)'];
    transition = { duration: 0.5, repeat: 1, ease: 'easeInOut' };
  } else if (phase === PHASE.BLASTING && isWin) {
    animate.scale = [1.06, 1.6, 0];
    animate.opacity = [1, 1, 0];
    animate.rotate = [0, 45];
    transition = { duration: 0.55, ease: 'easeIn' };
  } else if (phase === PHASE.BOMB_ARMED && isBomb) {
    animate.scale = [1, 1.2, 1, 1.2, 1];
    animate.rotate = [0, -8, 8, -8, 0];
    transition = { duration: 0.5, ease: 'easeInOut' };
  } else if (phase === PHASE.BOMB_BURST && isBombHit) {
    animate.scale = [1, 1.8, 0];
    animate.opacity = [1, 1, 0];
    transition = { duration: 0.6, ease: 'easeOut', delay: 0.05 };
  } else if (phase === PHASE.DROPPING) {
    animate.y = [-120, 0];
    animate.opacity = [0, 1];
    animate.scale = [0.9, 1];
    transition = { duration: 0.45, ease: [0.34, 1.56, 0.64, 1], delay: rowIdx * 0.05 + colIdx * 0.04 };
  }

  return (
    <motion.div
      className={`dh-cell tier-${sym?.tier || 'empty'} ${isWin ? 'dh-win' : ''} ${freeSpin ? 'dh-fs-cell' : ''}`}
      style={{ background: bg }}
      animate={animate}
      transition={transition}
      layout={false}
    >
      {sym && (
        <>
          <div className="dh-cell-emoji">{sym.emoji}</div>
          <div className="dh-cell-name">{sym.name}</div>
        </>
      )}
      {multiplier && (
        <motion.div
          className="dh-mult"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          x{multiplier}
        </motion.div>
      )}

      {/* Target crosshair when highlighted */}
      {phase === PHASE.TARGET_HIGHLIGHT && isWin && (
        <motion.div
          className="dh-target-hit"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.85] }}
          transition={{ duration: 0.5 }}
        >
          🎯
        </motion.div>
      )}

      {/* Blast particles */}
      {phase === PHASE.BLASTING && isWin && (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.div
              key={i}
              className="dh-particle"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 60,
                y: Math.sin((i / 8) * Math.PI * 2) * 60,
                opacity: 0,
                scale: 0.4,
              }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              style={{
                background: sym?.color || '#ffd700',
              }}
            />
          ))}
        </>
      )}

      {/* Bomb burst */}
      {phase === PHASE.BOMB_BURST && isBomb && (
        <motion.div
          className="dh-bomb-flash"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3.5, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  );
}

export default function SlotGrid({ board, cascadeData, spinning, freeSpin }) {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [displayBoard, setDisplayBoard] = useState(board || emptyBoard());
  const [winPositions, setWinPositions] = useState(new Set());
  const [bombPositions, setBombPositions] = useState(new Set());
  const [bombHitPositions, setBombHitPositions] = useState(new Set());
  const [multMap, setMultMap] = useState({});
  const [cascadeIdx, setCascadeIdx] = useState(0);
  const timerRef = useRef(null);

  // Spin start
  useEffect(() => {
    if (spinning) {
      setPhase(PHASE.SPINNING);
      setWinPositions(new Set());
      setBombPositions(new Set());
      setBombHitPositions(new Set());
    }
  }, [spinning]);

  // Play cascadeData sequence: LANDING → SHOWING → TARGET → BLAST → DROP → next step
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!cascadeData || cascadeData.length === 0) {
      if (board) setDisplayBoard(board);
      return;
    }

    let stepIdx = 0;
    const runStep = () => {
      const step = cascadeData[stepIdx];
      if (!step) {
        setPhase(PHASE.IDLE);
        setWinPositions(new Set());
        setBombPositions(new Set());
        setBombHitPositions(new Set());
        return;
      }

      const wins = getWinPositionSet(step.currentCountWin);
      const bombs = getBombSet(step.bombState);
      const bombHits = getRemovedBySet(step.bombState);
      const mults = getMultiplierMap(step.currentPositionMultiplier);
      setCascadeIdx(stepIdx);

      // Phase 1: Land — show initial board of this step
      setPhase(PHASE.LANDING);
      setDisplayBoard(step.board);
      setWinPositions(new Set());
      setBombPositions(new Set());
      setBombHitPositions(new Set());
      setMultMap(mults);

      const stagger = REELS * TIMINGS.landStagger + TIMINGS.postLand;

      timerRef.current = setTimeout(() => {
        setPhase(PHASE.SHOWING);

        if (wins.size > 0) {
          // Phase 2: Target highlight the winning symbols
          timerRef.current = setTimeout(() => {
            setPhase(PHASE.TARGET_HIGHLIGHT);
            setWinPositions(wins);

            // Phase 3: Blast (explode)
            timerRef.current = setTimeout(() => {
              setPhase(PHASE.BLASTING);

              // Phase 4: Clear removed cells → they'll refill on next step
              timerRef.current = setTimeout(() => {
                // move to next cascade step which shows refill
                stepIdx++;
                setPhase(PHASE.DROPPING);
                if (cascadeData[stepIdx]) {
                  timerRef.current = setTimeout(runStep, TIMINGS.refill);
                } else {
                  setPhase(PHASE.IDLE);
                  setWinPositions(new Set());
                }
              }, TIMINGS.blast);
            }, TIMINGS.targetHighlight);
          }, 250);
        } else if (bombs.size > 0) {
          // Phase 2b: Bomb armed animation
          setBombPositions(bombs);
          timerRef.current = setTimeout(() => {
            setPhase(PHASE.BOMB_ARMED);

            timerRef.current = setTimeout(() => {
              setPhase(PHASE.BOMB_BURST);
              setBombHitPositions(bombHits);

              timerRef.current = setTimeout(() => {
                stepIdx++;
                setPhase(PHASE.DROPPING);
                if (cascadeData[stepIdx]) {
                  timerRef.current = setTimeout(runStep, TIMINGS.refill);
                } else {
                  setPhase(PHASE.IDLE);
                  setBombPositions(new Set());
                  setBombHitPositions(new Set());
                }
              }, TIMINGS.bombBurst);
            }, TIMINGS.bombArm);
          }, 250);
        } else {
          // No win, no bomb → just advance
          stepIdx++;
          if (cascadeData[stepIdx]) {
            timerRef.current = setTimeout(runStep, 250);
          } else {
            setPhase(PHASE.IDLE);
          }
        }
      }, stagger);
    };

    runStep();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [cascadeData, board]);

  const isBlastingOrHighlight = phase === PHASE.TARGET_HIGHLIGHT || phase === PHASE.BLASTING;
  const currentBoard = displayBoard || emptyBoard();

  return (
    <div className={`dh-grid-container ${freeSpin ? 'dh-fs-mode' : ''}`}>
      {freeSpin && (
        <div className="dh-fs-particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              className="dh-fs-particle"
              initial={{ y: -20, x: `${(i * 5.5) % 100}%`, opacity: 0 }}
              animate={{ y: '110%', opacity: [0, 1, 0] }}
              transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.15, ease: 'linear' }}
            />
          ))}
        </div>
      )}

      <div className={`dh-grid ${freeSpin ? 'dh-fs-grid' : ''}`}>
        {Array.from({ length: REELS }).map((_, col) => (
          <div className="dh-reel" key={`reel-${col}`}>
            {Array.from({ length: ROWS }).map((_, row) => {
              const key = cellKey(col, row);
              const sym = currentBoard?.[col]?.[row];
              const isWin = winPositions.has(key);
              const isBomb = bombPositions.has(key);
              const isBombHit = bombHitPositions.has(key);
              const mult = multMap[key];

              return (
                <div className="dh-cell-slot" key={`slot-${key}`}>
                  <AnimatePresence mode="wait">
                    <Cell
                      key={`${key}-${cascadeIdx}-${phase}-${sym}`}
                      symId={sym}
                      phase={phase}
                      colIdx={col}
                      rowIdx={row}
                      isWin={isWin}
                      isBomb={isBomb}
                      isBombHit={isBombHit}
                      multiplier={mult}
                      freeSpin={freeSpin}
                    />
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {isBlastingOrHighlight && winPositions.size > 0 && (
        <motion.div
          className="dh-target-badge"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          🎯 {winPositions.size} TARGETS LOCKED
        </motion.div>
      )}
    </div>
  );
}
