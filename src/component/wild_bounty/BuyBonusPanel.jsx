import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WB_BONUS_BUY_OPTIONS } from './symbols';

export default function BuyBonusPanel({ open, onClose, onBuy, totalBet, balance }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ag-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="ag-modal ag-buy-modal"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ag-modal-header">
              <h2>🦅 Buy Uprising Spins</h2>
              <button className="ag-close" onClick={onClose}>✕</button>
            </div>

            <div className="ag-buy-hero">
              <div className="ag-buy-hero-icon">☀️</div>
              <div className="ag-buy-hero-text">
                Skip the wait — instantly launch into Free Spins with 3 Sun Idol scatters injected.
                Free spins start at <b style={{ color: '#ffcc00' }}>×8 multiplier</b> and double each cascade!
              </div>
            </div>

            <div className="ag-buy-cards">
              {WB_BONUS_BUY_OPTIONS.map((opt) => {
                const totalCost = opt.cost * totalBet;
                const affordable = balance >= totalCost;
                return (
                  <motion.div
                    key={opt.id}
                    className={`ag-buy-card ${affordable ? '' : 'ag-disabled'} ${opt.highlight ? 'ag-highlight' : ''}`}
                    whileHover={affordable ? { y: -4, scale: 1.02 } : {}}
                    onClick={() => affordable && onBuy(opt)}
                  >
                    <div className="ag-buy-name">{opt.name}</div>
                    <div className="ag-buy-desc">{opt.desc}</div>
                    <div className="ag-buy-cost-block">
                      <div className="ag-buy-cost">₱ {totalCost.toFixed(2)}</div>
                      <div className="ag-buy-mult">{opt.cost}× bet</div>
                    </div>
                    {affordable && <div className="ag-buy-cta">TAP TO BUY</div>}
                    {!affordable && <div className="ag-buy-cta ag-buy-noaffd">INSUFFICIENT BALANCE</div>}
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
