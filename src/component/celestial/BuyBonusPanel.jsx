import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CG_BONUS_BUY_OPTIONS } from './symbols';

export default function BuyBonusPanel({ open, onClose, onBuy, coinValue, balance }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cg-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cg-modal cg-buy-modal"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cg-modal-header">
              <h2>🌟 Buy Free Spins</h2>
              <button className="cg-close" onClick={onClose}>✕</button>
            </div>

            <div className="cg-buy-hero">
              <div className="cg-buy-hero-icon">🌌</div>
              <div className="cg-buy-hero-text">
                Skip the wait — instantly enter Free Spins with 4 Celestial scatters guaranteed on the reels.
              </div>
            </div>

            <div className="cg-buy-cards">
              {CG_BONUS_BUY_OPTIONS.map((opt) => {
                const totalCost = opt.cost * coinValue;
                const affordable = balance >= totalCost;
                return (
                  <motion.div
                    key={opt.id}
                    className={`cg-buy-card ${affordable ? '' : 'cg-disabled'} ${opt.highlight ? 'cg-highlight' : ''}`}
                    whileHover={affordable ? { y: -4, scale: 1.02 } : {}}
                    onClick={() => affordable && onBuy(opt)}
                  >
                    <div className="cg-buy-name">{opt.name}</div>
                    <div className="cg-buy-desc">{opt.desc}</div>
                    <div className="cg-buy-cost-block">
                      <div className="cg-buy-cost">€ {totalCost.toFixed(2)}</div>
                      <div className="cg-buy-mult">{opt.cost}× bet</div>
                    </div>
                    {affordable && <div className="cg-buy-cta">TAP TO BUY</div>}
                    {!affordable && <div className="cg-buy-cta cg-buy-noaffd">INSUFFICIENT BALANCE</div>}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
