import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HeistOverlay — Random Heist trigger banner.
 *
 * Fires when backend response contains `heistData.fired === true`.
 * Shows a dramatic "RANDOM HEIST!" banner + injected wilds count + heist win.
 * Auto-dismisses after `duration` ms (default 2.8s).
 */
export default function HeistOverlay({ show, wildsInjected = 0, winCurrency = 0, onDone, duration = 2800 }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDone && onDone(), duration);
    return () => clearTimeout(t);
  }, [show, duration, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="ag-heist-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Full-screen dim + red flash */}
          <motion.div
            className="ag-heist-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.3, 0.5, 0.2] }}
            transition={{ duration: 1.4, times: [0, 0.15, 0.4, 0.7, 1] }}
          />

          {/* Central banner */}
          <motion.div
            className="ag-heist-banner"
            initial={{ scale: 0.3, y: -100, opacity: 0, rotateZ: -10 }}
            animate={{
              scale: [0.3, 1.25, 1],
              y: 0,
              opacity: 1,
              rotateZ: [-10, 5, 0],
            }}
            exit={{ scale: 0.5, opacity: 0, y: 60 }}
            transition={{ duration: 0.7, ease: 'backOut' }}
          >
            <div className="ag-heist-title-row">
              <motion.span
                className="ag-heist-emoji"
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
              >💰</motion.span>
              <div className="ag-heist-title">RANDOM HEIST!</div>
              <motion.span
                className="ag-heist-emoji"
                animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                transition={{ duration: 0.6, repeat: 2 }}
              >💰</motion.span>
            </div>
            <div className="ag-heist-subtitle">
              {wildsInjected} Wild Symbols Injected!
            </div>
            {winCurrency > 0 && (
              <motion.div
                className="ag-heist-win"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: 'backOut' }}
              >
                +{Number(winCurrency).toFixed(2)}
              </motion.div>
            )}
          </motion.div>

          {/* Confetti burst — random wild icons flying out */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const dist = 180 + (i % 3) * 60;
            return (
              <motion.div
                key={i}
                className="ag-heist-particle"
                initial={{
                  x: 0, y: 0,
                  scale: 0,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  scale: [0, 1.2, 0.8],
                  opacity: [1, 1, 0],
                  rotate: 360 * 2,
                }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
              >⭐</motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
