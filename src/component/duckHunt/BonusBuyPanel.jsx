import React from 'react';
import { BONUS_BUY_OPTIONS } from './symbols';

export default function BonusBuyPanel({ open, onClose, onBuy, coinValue, balance }) {
  if (!open) return null;

  return (
    <div className="dh-modal-backdrop" onClick={onClose}>
      <div className="dh-modal dh-buy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dh-modal-header">
          <h2>Bonus Buy</h2>
          <button className="dh-close" onClick={onClose}>✕</button>
        </div>
        <div className="dh-buy-grid">
          {BONUS_BUY_OPTIONS.map((opt) => {
            const totalCost = opt.cost * coinValue;
            const affordable = balance >= totalCost;
            return (
              <div
                key={opt.id}
                className={`dh-buy-card ${affordable ? '' : 'dh-disabled'}`}
                onClick={() => affordable && onBuy(opt)}
              >
                <div className="dh-buy-name">{opt.name}</div>
                <div className="dh-buy-desc">{opt.desc}</div>
                <div className="dh-buy-cost">€ {totalCost.toFixed(2)}</div>
                <div className="dh-buy-mult">{opt.cost}× bet</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
