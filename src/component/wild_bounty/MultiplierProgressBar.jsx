import React from 'react';
import { motion } from 'framer-motion';
import { WB_MULT_TIERS } from './symbols';

/**
 * Horizontal multiplier progression bar (X2 X4 X8 X16 X32 ...)
 * Shows a 5-tier window centered on the current cascade multiplier.
 * The active tier is highlighted with a glowing blue orb.
 */
export default function MultiplierProgressBar({ currentMultiplier = 1 }) {
  // Find closest tier index for the current multiplier
  let activeIdx = WB_MULT_TIERS.findIndex((t) => t >= currentMultiplier);
  if (activeIdx === -1) activeIdx = WB_MULT_TIERS.length - 1;
  if (currentMultiplier < WB_MULT_TIERS[0]) activeIdx = 0;

  // Show a window of 5 tiers around the active one
  const windowStart = Math.max(0, activeIdx - 2);
  const windowEnd = Math.min(WB_MULT_TIERS.length, windowStart + 5);
  const visibleTiers = WB_MULT_TIERS.slice(windowStart, windowEnd);

  return (
    <div className="ag-mult-progress-bar">
      <div className="ag-mult-progress-track">
        {visibleTiers.map((tier, i) => {
          const globalIdx = windowStart + i;
          const isActive = globalIdx === activeIdx;
          const isPast = globalIdx < activeIdx;
          return (
            <motion.div
              key={tier}
              className={`ag-mult-tier ${isActive ? 'ag-mult-tier-active' : ''} ${isPast ? 'ag-mult-tier-past' : ''}`}
              animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
            >
              <span className="ag-mult-tier-x">X</span>
              <span className="ag-mult-tier-num">{tier}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
