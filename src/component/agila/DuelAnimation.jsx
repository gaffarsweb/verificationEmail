import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Wild Bounty Enhancement R1 — Cosmetic Duel (GDD §4.4)
 *
 * Pure presentation animation shown on natural FS entry BEFORE the
 * variant pick modal. Outcome is drawn by RNG server-side; this only
 * plays the visual. Contributes 0.00% EV.
 *
 * Sequence: hero vs villain standoff → clash → outcome flash → onComplete.
 */
export default function DuelAnimation({ show, outcome, onComplete }) {
  useEffect(() => {
    if (!show) return;
    // Total sequence ~2.4s; parent should mount the pick modal after.
    const t = setTimeout(() => onComplete?.(), 2400);
    return () => clearTimeout(t);
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="ag-duel-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="ag-duel-vignette" />

          {/* Hero — left */}
          <motion.div
            className="ag-duel-fighter ag-duel-hero"
            initial={{ x: -300, opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 90 }}
          >
            <div className="ag-duel-avatar">⚔️</div>
            <div className="ag-duel-name">HERO</div>
          </motion.div>

          {/* Clash flash */}
          <motion.div
            className="ag-duel-flash"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.6, 1.2], opacity: [0, 1, 0.9] }}
            transition={{ delay: 1.1, duration: 0.35 }}
          >
            {outcome === 'HERO' ? '⚡' : '🔥'}
          </motion.div>

          {/* Villain — right */}
          <motion.div
            className="ag-duel-fighter ag-duel-villain"
            initial={{ x: 300, opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 90 }}
          >
            <div className="ag-duel-avatar">🐺</div>
            <div className="ag-duel-name">VILLAIN</div>
          </motion.div>

          {/* Outcome banner */}
          <motion.div
            className={`ag-duel-outcome ${outcome === 'HERO' ? 'ag-duel-hero-wins' : 'ag-duel-villain-wins'}`}
            initial={{ scale: 0, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 1.55, type: 'spring', stiffness: 260 }}
          >
            {outcome === 'HERO' ? 'HERO STRIKES!' : 'VILLAIN CLAIMS!'}
          </motion.div>

          <motion.div
            className="ag-duel-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.85 }}
          >
            The winner sets your path…
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
