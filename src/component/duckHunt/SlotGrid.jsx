import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSymbol } from './symbols';

const REELS = 6;
const ROWS = 5;

const T = {
  target: 700,
  blast: 550,
  refill: 500,
  step: 250,
  firstLandWait: 850,
};

let cellIdCounter = 1;
const nextCellId = () => `c${cellIdCounter++}`;

function makeCell(symId) {
  return { id: nextCellId(), symId };
}

function boardToColumns(board) {
  if (!board) {
    return Array.from({ length: REELS }, () =>
      Array.from({ length: ROWS }, () => makeCell(null))
    );
  }
  return board.map((col) => col.map((symId) => makeCell(symId)));
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

function getBombHitSet(bombState) {
  const s = new Set();
  (bombState?.removedPositions || []).forEach((p) => s.add(cellKey(p.col, p.row)));
  return s;
}

/**
 * One cell in a reel.
 * Uses framer-motion `layout` so when siblings above are removed, this cell
 * smoothly slides down into the vacated slot.
 */
function Cell({ cell, freeSpin, isTargeted, isBombArmed, multiplier }) {
  const sym = cell.symId != null ? getSymbol(cell.symId) : null;
  const bg = sym ? `linear-gradient(160deg, ${sym.color}55, ${sym.color}22)` : 'transparent';

  const targetAnim = isTargeted
    ? {
        scale: [1, 1.14, 1.06],
        filter: ['brightness(1)', 'brightness(1.9)', 'brightness(1.4)'],
      }
    : { scale: 1, filter: 'brightness(1)' };

  const armAnim = isBombArmed
    ? { rotate: [0, -10, 10, -8, 8, 0] }
    : { rotate: 0 };

  return (
    <motion.div
      layout
      className={`dh-cell tier-${sym?.tier || 'empty'} ${isTargeted ? 'dh-win' : ''} ${freeSpin ? 'dh-fs-cell' : ''}`}
      style={{ background: bg }}
      initial={{ y: -180, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, ...targetAnim, ...armAnim }}
      exit={{ scale: 1.7, opacity: 0, rotate: 20, transition: { duration: 0.5, ease: 'easeIn' } }}
      transition={{
        y: { type: 'spring', stiffness: 380, damping: 26, mass: 0.8 },
        opacity: { duration: 0.28 },
        scale: isTargeted ? { duration: 0.5, repeat: 0 } : { type: 'spring', stiffness: 260, damping: 20 },
        filter: { duration: 0.5 },
        rotate: { duration: 0.5 },
        layout: { type: 'spring', stiffness: 320, damping: 28, mass: 0.7 },
      }}
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
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 15 }}
        >
          x{multiplier}
        </motion.div>
      )}
      {isTargeted && (
        <motion.div
          className="dh-target-hit"
          initial={{ scale: 0, opacity: 0, rotate: -30 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.9], rotate: 0 }}
          transition={{ duration: 0.5 }}
        >
          🎯
        </motion.div>
      )}
      {isBombArmed && (
        <motion.div
          className="dh-bomb-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.4, repeat: 1 }}
        />
      )}
    </motion.div>
  );
}

export default function SlotGrid({ board, cascadeData, spinning, freeSpin }) {
  const [columns, setColumns] = useState(() => boardToColumns(board));
  const [targetedIds, setTargetedIds] = useState(() => new Set());
  const [bombArmedIds, setBombArmedIds] = useState(() => new Set());
  const [multMap, setMultMap] = useState({});
  const [phase, setPhase] = useState('idle');
  const timersRef = useRef([]);
  const cascadeSeqRef = useRef(0);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const pushTimer = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  };

  // When spin starts, blur the current board
  useEffect(() => {
    if (spinning) {
      setPhase('spinning');
      setTargetedIds(new Set());
      setBombArmedIds(new Set());
    }
  }, [spinning]);

  // If no cascade yet but board updates (initial slot info), sync columns
  useEffect(() => {
    if ((!cascadeData || cascadeData.length === 0) && board && phase === 'idle') {
      setColumns(boardToColumns(board));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // Process cascadeData
  useEffect(() => {
    clearTimers();
    if (!cascadeData || cascadeData.length === 0) {
      setPhase('idle');
      return;
    }

    cascadeSeqRef.current += 1;
    const mySeq = cascadeSeqRef.current;

    // Step 0: rebuild columns from step[0].board with FRESH ids.
    // This causes AnimatePresence to mount all cells → they enter via initial={y:-180}
    // producing the full-grid "drop in from top" landing animation.
    const firstStep = cascadeData[0];
    setColumns(boardToColumns(firstStep.board));
    setMultMap(getMultiplierMap(firstStep.currentPositionMultiplier));
    setPhase('landing');
    setTargetedIds(new Set());
    setBombArmedIds(new Set());

    let stepIdx = 0;

    const processStep = () => {
      if (mySeq !== cascadeSeqRef.current) return;
      const step = cascadeData[stepIdx];
      if (!step) {
        setPhase('idle');
        setTargetedIds(new Set());
        setBombArmedIds(new Set());
        return;
      }
      const nextStep = cascadeData[stepIdx + 1];
      const winSet = getWinPositionSet(step.currentCountWin);
      const bombSet = getBombSet(step.bombState);
      const bombHitSet = getBombHitSet(step.bombState);

      // Combined set of "to be removed" (winners OR bomb-hit)
      const removedSet = new Set([...winSet, ...bombHitSet]);

      const initialWait = stepIdx === 0 ? T.firstLandWait : T.step;

      pushTimer(() => {
        if (mySeq !== cascadeSeqRef.current) return;
        setMultMap(getMultiplierMap(step.currentPositionMultiplier));

        if (removedSet.size === 0 && bombSet.size === 0) {
          stepIdx++;
          processStep();
          return;
        }

        // ------- PHASE: TARGETING / BOMB-ARMING -------
        setColumns((currentCols) => {
          const winIds = new Set();
          const armIds = new Set();
          currentCols.forEach((col, cIdx) => {
            col.forEach((cell, rIdx) => {
              const k = cellKey(cIdx, rIdx);
              if (winSet.has(k)) winIds.add(cell.id);
              if (bombSet.has(k)) armIds.add(cell.id);
            });
          });
          setTargetedIds(winIds);
          setBombArmedIds(armIds);
          setPhase(winSet.size > 0 ? 'targeting' : 'bomb-arming');
          return currentCols;
        });

        // ------- PHASE: BLAST + REFILL (framer handles gravity + entry) -------
        pushTimer(() => {
          if (mySeq !== cascadeSeqRef.current) return;
          setPhase('blasting');
          setColumns((currentCols) =>
            currentCols.map((col, cIdx) => {
              const removedRowsInCol = new Set();
              col.forEach((_, rIdx) => {
                const k = cellKey(cIdx, rIdx);
                if (removedSet.has(k)) removedRowsInCol.add(rIdx);
              });
              if (removedRowsInCol.size === 0) return col;

              // Survivors keep their IDs → framer `layout` slides them down.
              const survivors = col.filter((_, rIdx) => !removedRowsInCol.has(rIdx));

              // New cells at TOP of column, drawn from nextStep.board[col][0..N-1].
              // These get fresh IDs → AnimatePresence mounts them → they enter with initial={y:-180}.
              const newCount = removedRowsInCol.size;
              let newCells = [];
              if (nextStep && nextStep.board && nextStep.board[cIdx]) {
                newCells = Array.from({ length: newCount }, (_, i) =>
                  makeCell(nextStep.board[cIdx][i])
                );
              } else {
                // last cascade step — just fill with nulls (no next board)
                newCells = Array.from({ length: newCount }, () => makeCell(null));
              }

              return [...newCells, ...survivors];
            })
          );
          setTargetedIds(new Set());
          setBombArmedIds(new Set());

          pushTimer(() => {
            if (mySeq !== cascadeSeqRef.current) return;
            stepIdx++;
            processStep();
          }, T.blast + T.refill);
        }, T.target);
      }, initialWait);
    };

    processStep();

    return () => clearTimers();
  }, [cascadeData]);

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
              transition={{
                duration: 3 + (i % 4),
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      <div className={`dh-grid ${freeSpin ? 'dh-fs-grid' : ''}`}>
        {columns.map((col, cIdx) => (
          <div
            className={`dh-reel ${phase === 'spinning' ? 'dh-reel-spinning' : ''}`}
            key={`reel-${cIdx}`}
          >
            <AnimatePresence initial={false}>
              {col.map((cell, rIdx) => (
                <Cell
                  key={cell.id}
                  cell={cell}
                  freeSpin={freeSpin}
                  isTargeted={targetedIds.has(cell.id)}
                  isBombArmed={bombArmedIds.has(cell.id)}
                  multiplier={multMap[cellKey(cIdx, rIdx)]}
                />
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {phase === 'targeting' && targetedIds.size > 0 && (
        <motion.div
          className="dh-target-badge"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          🎯 {targetedIds.size} TARGETS LOCKED
        </motion.div>
      )}
    </div>
  );
}
