import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSymbol } from './symbols';

const REELS = 6;
const ROWS = 5;

const T = {
  firstLandWait: 900,
  betweenSteps: 350,
  winHighlight: 750,
  blast: 550,
  refill: 500,
  scatterZoom: 900,
};

let cellIdCounter = 1;
const nextCellId = () => `cg${cellIdCounter++}`;

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

function getWinPositionSet(currentCountWin = []) {
  const set = new Set();
  const perSymbol = {};
  for (const win of currentCountWin) {
    for (const pos of win.positions || []) {
      const k = cellKey(pos.col, pos.row);
      set.add(k);
      perSymbol[k] = win.symbolId;
    }
  }
  return { set, perSymbol };
}

/**
 * Pragmatic Play style cell — bounce drop, glow-pulse on win, scale-fade on blast.
 */
function Cell({ cell, freeSpin, isWin, winSymbolId }) {
  const sym = cell.symId != null ? getSymbol(cell.symId) : null;
  const bg = sym ? `radial-gradient(circle at 30% 30%, ${sym.color}66, ${sym.color}22)` : 'transparent';
  const isScatter = sym?.tier === 'scatter';

  const winAnim = isWin
    ? {
        scale: [1, 1.18, 1.1, 1.18, 1.1],
        filter: [
          'brightness(1) drop-shadow(0 0 0 transparent)',
          'brightness(2) drop-shadow(0 0 22px #ffd700)',
          'brightness(1.6) drop-shadow(0 0 16px #ffd700)',
          'brightness(2) drop-shadow(0 0 22px #ffd700)',
          'brightness(1.6) drop-shadow(0 0 16px #ffd700)',
        ],
      }
    : {};

  return (
    <motion.div
      layout
      className={`cg-cell tier-${sym?.tier || 'empty'} ${isWin ? 'cg-win' : ''} ${freeSpin ? 'cg-fs-cell' : ''}`}
      style={{ background: bg }}
      initial={{ y: -220, opacity: 0, scale: 0.85, rotate: -6 }}
      animate={{ y: 0, opacity: 1, scale: 1, rotate: 0, ...winAnim }}
      exit={{
        scale: [1.1, 1.9, 0],
        opacity: [1, 1, 0],
        rotate: [0, 12, 30],
        transition: { duration: 0.55, ease: 'easeIn', times: [0, 0.35, 1] },
      }}
      transition={{
        y: { type: 'spring', stiffness: 320, damping: 22, mass: 0.9 },
        opacity: { duration: 0.3 },
        rotate: { type: 'spring', stiffness: 200, damping: 15 },
        scale: isWin ? { duration: 0.7, repeat: 0 } : { type: 'spring', stiffness: 240, damping: 18 },
        filter: { duration: 0.7 },
        layout: { type: 'spring', stiffness: 300, damping: 26, mass: 0.75 },
      }}
    >
      {sym && (
        <>
          <div className="cg-cell-emoji">{sym.emoji}</div>
          <div className="cg-cell-name">{sym.name}</div>
        </>
      )}

      {isScatter && (
        <motion.div
          className="cg-scatter-halo"
          animate={{ rotate: 360, opacity: [0.4, 0.9, 0.4] }}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, opacity: { duration: 2, repeat: Infinity } }}
        />
      )}

      {isWin && (
        <>
          <motion.div
            className="cg-win-ring"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.6, 1.2], opacity: [0, 1, 0.6] }}
            transition={{ duration: 0.75, repeat: 1 }}
          />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.div
              key={i}
              className="cg-spark"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 48,
                y: Math.sin((i / 8) * Math.PI * 2) * 48,
                opacity: 0,
                scale: 0.2,
              }}
              transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
              style={{ background: sym?.color || '#ffd700' }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

export default function CelestialGrid({ board, cascadeData, spinning, freeSpin, currentMultiplier }) {
  const [columns, setColumns] = useState(() => boardToColumns(board));
  const [winIds, setWinIds] = useState(new Set());
  const [winSymbolMap, setWinSymbolMap] = useState({});
  const [phase, setPhase] = useState('idle');
  const [stepInfo, setStepInfo] = useState({ stepIdx: 0, currentWin: 0, cascadeMult: 1 });
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

  useEffect(() => {
    if (spinning) {
      setPhase('spinning');
      setWinIds(new Set());
    }
  }, [spinning]);

  useEffect(() => {
    if ((!cascadeData || cascadeData.length === 0) && board && phase === 'idle') {
      setColumns(boardToColumns(board));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  useEffect(() => {
    clearTimers();
    if (!cascadeData || cascadeData.length === 0) {
      setPhase('idle');
      return;
    }

    cascadeSeqRef.current += 1;
    const mySeq = cascadeSeqRef.current;

    const firstStep = cascadeData[0];
    setColumns(boardToColumns(firstStep.board));
    setPhase('landing');
    setWinIds(new Set());
    setStepInfo({ stepIdx: 0, currentWin: firstStep.currentWin || 0, cascadeMult: firstStep.currentMultiplier || 1 });

    let stepIdx = 0;

    const processStep = () => {
      if (mySeq !== cascadeSeqRef.current) return;
      const step = cascadeData[stepIdx];
      if (!step) {
        setPhase('idle');
        setWinIds(new Set());
        return;
      }
      const nextStep = cascadeData[stepIdx + 1];
      const { set: winSet, perSymbol } = getWinPositionSet(step.currentCountWin);

      const wait = stepIdx === 0 ? T.firstLandWait : T.betweenSteps;

      pushTimer(() => {
        if (mySeq !== cascadeSeqRef.current) return;
        setStepInfo({
          stepIdx,
          currentWin: step.currentWinCurrency || step.currentWin || 0,
          cascadeMult: step.currentMultiplier || currentMultiplier || 1,
        });

        if (winSet.size === 0) {
          stepIdx++;
          processStep();
          return;
        }

        // ------- HIGHLIGHT WINS -------
        setColumns((currentCols) => {
          const wins = new Set();
          const symMap = {};
          currentCols.forEach((col, cIdx) => {
            col.forEach((cell, rIdx) => {
              const k = cellKey(cIdx, rIdx);
              if (winSet.has(k)) {
                wins.add(cell.id);
                symMap[cell.id] = perSymbol[k];
              }
            });
          });
          setWinIds(wins);
          setWinSymbolMap(symMap);
          setPhase('winning');
          return currentCols;
        });

        // ------- BLAST + TUMBLE -------
        pushTimer(() => {
          if (mySeq !== cascadeSeqRef.current) return;
          setPhase('blasting');
          setColumns((currentCols) =>
            currentCols.map((col, cIdx) => {
              const removedRows = new Set();
              col.forEach((_, rIdx) => {
                if (winSet.has(cellKey(cIdx, rIdx))) removedRows.add(rIdx);
              });
              if (removedRows.size === 0) return col;

              const survivors = col.filter((_, rIdx) => !removedRows.has(rIdx));
              const newCount = removedRows.size;
              let newCells = [];
              if (nextStep && nextStep.board && nextStep.board[cIdx]) {
                newCells = Array.from({ length: newCount }, (_, i) =>
                  makeCell(nextStep.board[cIdx][i])
                );
              } else {
                newCells = Array.from({ length: newCount }, () => makeCell(null));
              }
              return [...newCells, ...survivors];
            })
          );
          setWinIds(new Set());

          pushTimer(() => {
            if (mySeq !== cascadeSeqRef.current) return;
            stepIdx++;
            processStep();
          }, T.blast + T.refill);
        }, T.winHighlight);
      }, wait);
    };

    processStep();

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cascadeData]);

  return (
    <div className={`cg-grid-container ${freeSpin ? 'cg-fs-mode' : ''}`}>
      {/* Ambient stars background */}
      <div className="cg-stars">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="cg-star"
            style={{ top: `${(i * 7.3) % 100}%`, left: `${(i * 13.7) % 100}%` }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.2, 0.7] }}
            transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>

      {freeSpin && (
        <div className="cg-fs-nebula">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="cg-nebula-particle"
              initial={{ y: -20, x: `${(i * 5) % 100}%`, opacity: 0 }}
              animate={{ y: '110%', opacity: [0, 1, 0], rotate: [0, 360] }}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.2, ease: 'linear' }}
            />
          ))}
        </div>
      )}

      <div className={`cg-grid ${freeSpin ? 'cg-fs-grid' : ''}`}>
        {columns.map((col, cIdx) => (
          <div
            className={`cg-reel ${phase === 'spinning' ? 'cg-reel-spinning' : ''}`}
            key={`reel-${cIdx}`}
          >
            <AnimatePresence initial={false}>
              {col.map((cell) => (
                <Cell
                  key={cell.id}
                  cell={cell}
                  freeSpin={freeSpin}
                  isWin={winIds.has(cell.id)}
                  winSymbolId={winSymbolMap[cell.id]}
                />
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Win amount pop-up (Pragmatic style) */}
      {phase === 'winning' && stepInfo.currentWin > 0 && (
        <motion.div
          className="cg-cascade-win"
          initial={{ y: -30, scale: 0.7, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="cg-cascade-win-label">CASCADE WIN</div>
          <div className="cg-cascade-win-amt">€ {(stepInfo.currentWin).toFixed(2)}</div>
          {freeSpin && stepInfo.cascadeMult > 1 && (
            <div className="cg-cascade-mult">× {stepInfo.cascadeMult}</div>
          )}
        </motion.div>
      )}

      {/* Free spin persistent multiplier badge (top-right corner) */}
      {freeSpin && (
        <motion.div
          className="cg-fs-mult-badge"
          initial={{ scale: 0.6 }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="cg-fs-mult-label">MULTIPLIER</div>
          <div className="cg-fs-mult-value">× {currentMultiplier || 1}</div>
        </motion.div>
      )}
    </div>
  );
}
