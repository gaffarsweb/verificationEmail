import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function FreeSpinBadge({ active, remaining, total, totalWon, multiplier }) {
  if (!active) return null;
  return (
    <motion.div
      className="cg-fs-hud"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="cg-fs-hud-title">✨ FREE SPINS ✨</div>
      <div className="cg-fs-hud-row">
        <div className="cg-fs-hud-item">
          <span>Remaining</span>
          <b>{remaining} / {total}</b>
        </div>
        <div className="cg-fs-hud-item">
          <span>Total Won</span>
          <b>€ {(totalWon || 0).toFixed(2)}</b>
        </div>
        <div className="cg-fs-hud-item">
          <span>Multiplier</span>
          <b>× {multiplier || 1}</b>
        </div>
      </div>
    </motion.div>
  );
}

export function WinBanner({ amount, currency = '€' }) {
  if (!amount || amount <= 0) return null;
  const tier = amount > 100 ? 'mega' : amount > 30 ? 'big' : 'normal';
  const label = tier === 'mega' ? 'MEGA WIN' : tier === 'big' ? 'BIG WIN' : 'WIN';
  return (
    <AnimatePresence>
      <motion.div
        key="cg-winbanner"
        className={`cg-win-banner cg-win-${tier}`}
        initial={{ scale: 0.5, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="cg-win-label">{label}</div>
        <motion.div
          className="cg-win-amount"
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
 * Scatter trigger animation — fires once when 4+ scatters land.
 * Big centered zoom + text + fade.
 */
export function ScatterTrigger({ show, scatterCount, onDone }) {
  React.useEffect(() => {
    if (show && onDone) {
      const t = setTimeout(onDone, 2400);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="cg-scatter-trigger"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="cg-scatter-trigger-inner"
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: [0.4, 1.2, 1], rotate: [0, 10, 0] }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.9 }}
          >
            <div className="cg-scatter-emoji">🌟</div>
            <div className="cg-scatter-title">FREE SPINS</div>
            <div className="cg-scatter-sub">{scatterCount} Celestial Scatters</div>
            <div className="cg-scatter-award">15 SPINS AWARDED</div>
          </motion.div>
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="cg-scatter-particle"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i / 16) * Math.PI * 2) * 300,
                y: Math.sin((i / 16) * Math.PI * 2) * 300,
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
