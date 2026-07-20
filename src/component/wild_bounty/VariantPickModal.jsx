import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WB_VARIANT_OPTIONS } from './symbols';

/**
 * Wild Bounty Enhancement R1 — Variant Pick Modal (GDD §4.1)
 *
 * Shown when server emits GET_PICK_REQUEST after natural or bought FS entry.
 * Player chooses RISKY / STABLE / MYSTERY — all EV-equal at 0.50892.
 * On selection, parent emits SEND_PICK_CHOICE with the token.
 */
export default function VariantPickModal({ open, onPick, duelOutcome }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ag-modal-backdrop ag-pick-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="ag-pick-modal"
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="ag-pick-header">
              {duelOutcome && (
                <motion.div
                  className="ag-pick-duel-outcome"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {duelOutcome === 'HERO' ? '⚡ HERO PREVAILS ⚡' : '🔥 VILLAIN STRIKES 🔥'}
                </motion.div>
              )}
              <h2 className="ag-pick-title">CHOOSE YOUR PATH</h2>
              <p className="ag-pick-subtitle">
                All three grant the same expected value. Only the shape differs.
              </p>
            </div>

            <div className="ag-pick-cards">
              {WB_VARIANT_OPTIONS.map((v, i) => (
                <motion.div
                  key={v.id}
                  className={`ag-pick-card ag-pick-${v.id.toLowerCase()}`}
                  style={{ '--variant-color': v.color }}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onPick(v.id)}
                >
                  <div className="ag-pick-icon">{v.icon}</div>
                  <div className="ag-pick-name">{v.name}</div>
                  <div className="ag-pick-stats">
                    <div className="ag-pick-stat">
                      <span className="ag-pick-stat-label">SPINS</span>
                      <span className="ag-pick-stat-val">{v.spinsLabel}</span>
                    </div>
                    <div className="ag-pick-stat">
                      <span className="ag-pick-stat-label">START MULT</span>
                      <span className="ag-pick-stat-val">×{v.startMult}</span>
                    </div>
                    <div className="ag-pick-stat">
                      <span className="ag-pick-stat-label">VOLATILITY</span>
                      <span className="ag-pick-stat-val">{v.volatility}</span>
                    </div>
                  </div>
                  <div className="ag-pick-desc">{v.desc}</div>
                  <div className="ag-pick-cta">TAP TO CHOOSE</div>
                </motion.div>
              ))}
            </div>

            <div className="ag-pick-footer">
              Same EV · Compliant · No skill affects payout
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
