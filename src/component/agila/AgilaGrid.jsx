import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSymbol, AG_REEL_ROWS } from './symbols';

const T = {
  firstLandWait: 950,
  betweenSteps: 350,
  winHighlight: 800,
  blast: 600,
  refill: 550,
};

let cellIdCounter = 1;
const nextCellId = () => `ag${cellIdCounter++}`;

function makeCell(symId, golden = false) {
  return { id: nextCellId(), symId, golden };
}

function boardToColumns(board, goldenFramePositions = []) {
  if (!board) {
    return AG_REEL_ROWS.map((rows) =>
      Array.from({ length: rows }, () => makeCell(null))
    );
  }
  const goldenSet = new Set(
    goldenFramePositions.map((g) => `${g.position.col}-${g.position.row}`)
  );
  return board.map((col, cIdx) =>
    col.map((symId, rIdx) => makeCell(symId, goldenSet.has(`${cIdx}-${rIdx}`)))
  );
}

function cellKey(c, r) { return `${c}-${r}`; }

function getWinPositionSet(currentWaysWin = []) {
  const set = new Set();
  const perSymbol = {};
  for (const win of currentWaysWin) {
    for (const pos of win.positions || []) {
      const k = cellKey(pos.col, pos.row);
      set.add(k);
      perSymbol[k] = win.symbolId;
    }
  }
  return { set, perSymbol };
}

function getGoldenSet(goldenFramePositions = []) {
  const set = new Set();
  for (const g of goldenFramePositions) {
    if (g?.position) set.add(cellKey(g.position.col, g.position.row));
  }
  return set;
}

/**
 * Cell with optional golden frame overlay (Agila mechanic — golden = wild reveal on win)
 */
function Cell({ cell, isWin, isGolden, freeSpin }) {
  const sym = cell.symId != null ? getSymbol(cell.symId) : null;
  // isEmpty catches BOTH: (a) missing symId AND (b) unknown symId that fell
  // through to getSymbol's `?` fallback (color:#333, tier:'unknown'). The
  // fallback used to render as a black-on-black square with a golden frame
  // (backend cascade overshoot / staggered-layout mismatch marks an empty
  // slot as golden). Treat it as a placeholder gap instead.
  const isEmpty = !sym || sym.tier === 'unknown';
  const bg = (sym && !isEmpty)
    ? `radial-gradient(circle at 30% 30%, ${sym.color}77, ${sym.color}22)`
    : 'transparent';
  const showGolden = isGolden && !isEmpty;

  // Exit-time source-of-truth: the cell is a winner if either the current isWin
  // prop says so, OR the cell was tagged as a winner at removal time. React 18
  // batching can race the winIds clear with AnimatePresence's exit-prop read;
  // the cell.wasWinner tag survives that race because it's set at removal time.
  const wasWinnerCell = isWin || !!cell.wasWinner;

  // Brightness peak kept below 1.4 so the symbol emoji stays visible even
  // for yellow symbols (GOLD, SCAT). Earlier value 2.2 washed the cell out
  // and yellow-on-yellow made the symbol invisible. The glow is now
  // delivered via drop-shadow radius (outside the cell) rather than
  // brightness (inside the cell), so contrast on the symbol is preserved.
  const winAnim = isWin
    ? {
        scale: [1, 1.18, 1.10, 1.18, 1.10],
        filter: [
          'brightness(1) drop-shadow(0 0 0 transparent)',
          'brightness(1.35) drop-shadow(0 0 22px #ffcc00) drop-shadow(0 0 8px #fff)',
          'brightness(1.2) drop-shadow(0 0 14px #ffcc00) drop-shadow(0 0 6px #fff)',
          'brightness(1.35) drop-shadow(0 0 22px #ffcc00) drop-shadow(0 0 8px #fff)',
          'brightness(1.2) drop-shadow(0 0 14px #ffcc00) drop-shadow(0 0 6px #fff)',
        ],
      }
    : {};

  return (
    <motion.div
      // No `layout` on winners during their exit — layout can hijack the
      // scale-blast into a positional slide, making the burst look like a
      // "fly up". Non-winners keep layout so gravity slide still animates.
      layout={!wasWinnerCell}
      className={`ag-cell tier-${sym?.tier || 'empty'} ${isWin ? 'ag-win' : ''} ${showGolden ? 'ag-golden' : ''} ${freeSpin ? 'ag-fs-cell' : ''} ${isEmpty ? 'ag-cell-gap' : ''}`}
      style={{ background: bg }}
      // New symbols slide DOWN from top — slot-machine drop feel
      initial={{ y: -280, opacity: 0, scale: 1 }}
      animate={{ y: 0, opacity: 1, scale: 1, ...winAnim }}
      // Two-mode exit animation:
      //   - Winning cells: BLAST in place (grow → collapse) — celebration
      //   - Non-winners:   SLIDE DOWN and off-grid — pushed by new symbols
      exit={wasWinnerCell
        ? {
            // Win blast — no y movement, pure scale explosion in place
            y: 0,
            scale: [1, 1.35, 1.6, 0.1],
            opacity: [1, 1, 0.9, 0],
            transition: { duration: 0.45, ease: 'easeOut', times: [0, 0.3, 0.6, 1] },
          }
        : {
            // Slide down out of view — pushed by new symbols from above
            y: 280,
            opacity: [1, 1, 0],
            transition: { duration: 0.5, ease: 'easeIn', times: [0, 0.6, 1] },
          }
      }
      transition={{
        // Slot-machine drop timing — bouncy landing
        y: { type: 'spring', stiffness: 260, damping: 20, mass: 1 },
        opacity: { duration: 0.25 },
        scale: wasWinnerCell ? { duration: 0.75, repeat: 0 } : { type: 'spring', stiffness: 240, damping: 22 },
        filter: { duration: 0.75 },
        // Framer's `layout` handles the gravity slide of surviving symbols
        // moving DOWN to fill empty spots left by winning bursts.
        layout: { type: 'spring', stiffness: 280, damping: 24, mass: 0.85 },
      }}
    >
      {/* Golden frame — only if there's a symbol to frame.
          When the cell is a winner, the frame FADES OUT first (opacity 1→0,
          expanding slightly for a "release" feel). This runs during the
          winHighlight window (800ms), so by the time the blast exit
          animation fires, the frame is already gone and the bare symbol
          blasts cleanly — matching the requested UX: golden reveals →
          symbol clear → symbol blasts. */}
      {showGolden && (
        <motion.div
          className="ag-golden-frame"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={isWin
            ? { opacity: 0, scale: 1.25 }
            : { opacity: 1, scale: 1 }
          }
          transition={{ duration: isWin ? 0.35 : 0.4, ease: 'easeOut' }}
        />
      )}

      {sym && !isEmpty && (
        <>
          <div className="ag-cell-emoji">{sym.emoji}</div>
          <div className="ag-cell-name">{sym.name}</div>
        </>
      )}

      {sym?.tier === 'scatter' && !isEmpty && (
        <motion.div
          className="ag-scatter-halo"
          animate={{ rotate: 360, opacity: [0.4, 0.9, 0.4] }}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, opacity: { duration: 2, repeat: Infinity } }}
        />
      )}

      {isWin && (
        <>
          <motion.div
            className="ag-win-ring"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.6, 1.2], opacity: [0, 1, 0.6] }}
            transition={{ duration: 0.8, repeat: 1 }}
          />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.div
              key={i}
              className="ag-spark"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 50,
                y: Math.sin((i / 8) * Math.PI * 2) * 50,
                opacity: 0,
                scale: 0.2,
              }}
              transition={{ duration: 0.75, delay: 0.28, ease: 'easeOut' }}
              style={{ background: sym?.color || '#ffcc00' }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

export default function AgilaGrid({ board, cascadeData, spinning, freeSpin, currentMultiplier, goldenFramePositions }) {
  const [columns, setColumns] = useState(() => boardToColumns(board, goldenFramePositions));
  const [winIds, setWinIds] = useState(new Set());
  const [goldenIds, setGoldenIds] = useState(new Set());
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
      const cols = boardToColumns(board, goldenFramePositions);
      setColumns(cols);
      const goldSet = new Set();
      cols.forEach((col) => col.forEach((c) => { if (c.golden) goldSet.add(c.id); }));
      setGoldenIds(goldSet);
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
    const firstCols = boardToColumns(firstStep.board, firstStep.goldenFramePositions);
    setColumns(firstCols);
    const firstGoldSet = new Set();
    firstCols.forEach((col) => col.forEach((c) => { if (c.golden) firstGoldSet.add(c.id); }));
    setGoldenIds(firstGoldSet);

    setPhase('landing');
    setWinIds(new Set());
    setStepInfo({
      stepIdx: 0,
      // Show currentWinCurrency (the actual money credited to wallet),
      // NOT currentWin (raw multiplier points). Backend credits winCurrency.
      currentWin: firstStep.currentWinCurrency || firstStep.currentWin || 0,
      cascadeMult: firstStep.currentMultiplier || 1,
    });

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
      const { set: winSet } = getWinPositionSet(step.currentWaysWin);

      const wait = stepIdx === 0 ? T.firstLandWait : T.betweenSteps;

      pushTimer(() => {
        if (mySeq !== cascadeSeqRef.current) return;
        setStepInfo({
          stepIdx,
          currentWin: step.currentWinCurrency || step.currentWin || 0,
          cascadeMult: step.currentMultiplier || 1,
        });

        if (winSet.size === 0) {
          stepIdx++;
          processStep();
          return;
        }

        // HIGHLIGHT
        setColumns((currentCols) => {
          const wins = new Set();
          currentCols.forEach((col, cIdx) => {
            col.forEach((cell, rIdx) => {
              const k = cellKey(cIdx, rIdx);
              if (winSet.has(k)) wins.add(cell.id);
            });
          });
          setWinIds(wins);
          setPhase('winning');
          return currentCols;
        });

        // BLAST + REFILL
        pushTimer(() => {
          if (mySeq !== cascadeSeqRef.current) return;
          setPhase('blasting');

          // Compute next columns
          const nextGoldenSet = getGoldenSet(nextStep?.goldenFramePositions);

          setColumns((currentCols) =>
            currentCols.map((col, cIdx) => {
              const removedRows = new Set();
              col.forEach((cell, rIdx) => {
                const k = cellKey(cIdx, rIdx);
                if (winSet.has(k)) {
                  // ALL winning cells (including golden) blast. Earlier code
                  // kept golden cells alive as persistent wilds — but the
                  // desired UX is: golden frame fades → symbol reveals →
                  // symbol blasts, same as any other winner.
                  //
                  // The golden frame fade happens during the highlight phase
                  // (see .ag-golden-frame animate prop below, keyed on isWin).
                  // By the time this blast setColumns runs, the frame is
                  // already at opacity 0, so blast plays on the bare symbol.
                  removedRows.add(rIdx);
                  cell.wasWinner = true;
                  if (cell.golden) cell.wasGoldenWinner = true;
                }
              });
              if (removedRows.size === 0) return col;

              const survivors = col
                .filter((_, rIdx) => !removedRows.has(rIdx))
                .map((cell, sIdx) => {
                  // Post-cascade the survivor's row shifts. We can't easily know the exact new row here for golden persistence,
                  // so we recompute golden flag from nextStep.goldenFramePositions using the survivor's projected position.
                  // Framer layout handles the visual slide; we just need golden flag on the correct cell.
                  return cell;
                });

              const newCount = removedRows.size;
              let newCells = [];
              if (nextStep && nextStep.board && nextStep.board[cIdx]) {
                newCells = Array.from({ length: newCount }, (_, i) => {
                  const rowIndexInNext = i;
                  const isGold = nextGoldenSet.has(`${cIdx}-${rowIndexInNext}`);
                  return makeCell(nextStep.board[cIdx][rowIndexInNext], isGold);
                });
              } else {
                newCells = Array.from({ length: newCount }, () => makeCell(null));
              }
              return [...newCells, ...survivors];
            })
          );

          // Update goldenIds after column change (framer next render)
          setTimeout(() => {
            setColumns((currentCols) => {
              const goldSet = new Set();
              currentCols.forEach((col) => col.forEach((c) => { if (c.golden) goldSet.add(c.id); }));
              setGoldenIds(goldSet);
              return currentCols;
            });
          }, 30);

          pushTimer(() => {
            if (mySeq !== cascadeSeqRef.current) return;
            // Clear winIds AFTER the exit blast animation has completed.
            // Clearing earlier races with AnimatePresence's exit prop evaluation.
            setWinIds(new Set());
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
    <div className={`ag-grid-container ${freeSpin ? 'ag-fs-mode' : ''}`}>
      {/* Ambient tribal pattern glow */}
      <div className="ag-tribal-glow" />

      {freeSpin && (
        <div className="ag-fs-embers">
          {Array.from({ length: 22 }).map((_, i) => (
            <motion.div
              key={i}
              className="ag-ember"
              initial={{ y: '110%', x: `${(i * 4.5) % 100}%`, opacity: 0 }}
              animate={{ y: '-20%', opacity: [0, 1, 0], scale: [0.5, 1.2, 0.6] }}
              transition={{ duration: 3.5 + (i % 3), repeat: Infinity, delay: i * 0.18, ease: 'linear' }}
            />
          ))}
        </div>
      )}

      {/* Asymmetric 3-4-5-5-4-3 grid */}
      <div className={`ag-grid ${freeSpin ? 'ag-fs-grid' : ''}`}>
        {columns.map((col, cIdx) => {
          const reelRows = AG_REEL_ROWS[cIdx];
          const maxRows = 5; // Grid max row count
          const emptyTopSlots = maxRows - reelRows;
          return (
            <div
              className={`ag-reel ag-reel-${reelRows} ${phase === 'spinning' ? 'ag-reel-spinning' : ''}`}
              key={`reel-${cIdx}`}
            >
              {/* Placeholder decorations for staggered layout gaps — these are
                  intentionally blank positions in the 3-4-5-5-4-3 reel config,
                  not real playable cells. Rendered faded so they don't look like
                  broken cells. */}
              {Array.from({ length: emptyTopSlots }).map((_, i) => (
                <div key={`gap-${cIdx}-${i}`} className="ag-cell ag-cell-gap" />
              ))}
              <AnimatePresence initial={false}>
                {col.map((cell) => (
                  <Cell
                    key={cell.id}
                    cell={cell}
                    freeSpin={freeSpin}
                    isWin={winIds.has(cell.id)}
                    isGolden={goldenIds.has(cell.id) || cell.golden}
                  />
                ))}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Cascade multiplier & win popup */}
      {phase === 'winning' && stepInfo.currentWin > 0 && (
        <motion.div
          className="ag-cascade-win"
          initial={{ y: -30, scale: 0.7, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="ag-cascade-win-label">CASCADE WIN</div>
          <div className="ag-cascade-win-amt">₱ {(stepInfo.currentWin).toFixed(2)}</div>
          <div className="ag-cascade-mult">× {stepInfo.cascadeMult}</div>
        </motion.div>
      )}

      {/* Persistent multiplier badge (Agila's doubling cascade mult) */}
      <motion.div
        className={`ag-mult-badge ${freeSpin ? 'ag-mult-fs' : ''}`}
        initial={{ scale: 0.6 }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="ag-mult-label">MULTIPLIER</div>
        <div className="ag-mult-value">× {stepInfo.cascadeMult || currentMultiplier || (freeSpin ? 8 : 1)}</div>
      </motion.div>
    </div>
  );
}
