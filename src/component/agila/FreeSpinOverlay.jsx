import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function FreeSpinBadge({ active, remaining, total, totalWon, multiplier }) {
  if (!active) return null;
  return (
    <motion.div
      className="ag-fs-hud"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="ag-fs-hud-title">☀️ AGILA UPRISING ☀️</div>
      <div className="ag-fs-hud-row">
        <div className="ag-fs-hud-item"><span>Remaining</span><b>{remaining} / {total}</b></div>
        <div className="ag-fs-hud-item"><span>Total Won</span><b>₱ {(totalWon || 0).toFixed(2)}</b></div>
        <div className="ag-fs-hud-item"><span>Multiplier</span><b>× {multiplier || 1}</b></div>
      </div>
    </motion.div>
  );
}

export function WinBanner({ amount, currency = '₱' }) {
  if (!amount || amount <= 0) return null;
  const tier = amount > 100 ? 'mega' : amount > 30 ? 'big' : 'normal';
  const label = tier === 'mega' ? 'MEGA WIN' : tier === 'big' ? 'BIG WIN' : 'WIN';
  return (
    <AnimatePresence>
      <motion.div
        key="ag-winbanner"
        className={`ag-win-banner ag-win-${tier}`}
        initial={{ scale: 0.5, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="ag-win-label">{label}</div>
        <motion.div
          className="ag-win-amount"
          animate={tier !== 'normal' ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          {currency} {amount.toFixed(2)}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Full-screen scatter trigger animation
 */
export function ScatterTrigger({ show, scatterCount, freeSpinCount, onDone }) {
  // Store latest onDone in a ref so the effect's timer isn't reset by parent
  // re-renders (which pass a new inline callback every render). Without this,
  // the parent's frequent state updates during FS re-arm the setTimeout
  // repeatedly and the overlay never dismisses.
  const onDoneRef = React.useRef(onDone);
  onDoneRef.current = onDone;

  React.useEffect(() => {
    if (!show) return;
    // 2s hero display, then auto-dismiss so FS gameplay reels are visible.
    const t = setTimeout(() => {
      if (typeof onDoneRef.current === 'function') onDoneRef.current();
    }, 2000);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="ag-scatter-trigger"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="ag-scatter-trigger-inner"
            initial={{ scale: 0.4, rotate: -15 }}
            animate={{ scale: [0.4, 1.2, 1], rotate: [0, 8, 0] }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="ag-scatter-emoji">🦅</div>
            <div className="ag-scatter-title">AGILA UPRISING</div>
            <div className="ag-scatter-sub">{scatterCount} SUN IDOL SCATTERS</div>
            <div className="ag-scatter-award">{freeSpinCount} FREE SPINS · START AT ×8</div>
          </motion.div>
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              className="ag-scatter-particle"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i / 18) * Math.PI * 2) * 320,
                y: Math.sin((i / 18) * Math.PI * 2) * 320,
                opacity: 0,
              }}
              transition={{ duration: 1.6, delay: 0.4 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
