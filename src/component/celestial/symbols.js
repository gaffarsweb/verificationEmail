// Celestial Guardians symbol map — space/cosmic theme
export const CG_SYMBOLS = {
  1:  { name: 'H1',      label: 'Sun God',     color: '#ffb84d', emoji: '☀️', tier: 'high',    payout: [null, null, null, null, null, null, null, null, 200, 200, 500, 500, 1000] },
  2:  { name: 'H2',      label: 'Moon',        color: '#a4b8ff', emoji: '🌙', tier: 'high',    payout: [null, null, null, null, null, null, null, null, 50,  50,  200, 200, 500] },
  3:  { name: 'H3',      label: 'Star',        color: '#ffdc4d', emoji: '⭐', tier: 'high',    payout: [null, null, null, null, null, null, null, null, 40,  40,  100, 100, 300] },
  4:  { name: 'H4',      label: 'Comet',       color: '#ff77b8', emoji: '☄️', tier: 'high',    payout: [null, null, null, null, null, null, null, null, 30,  30,  40,  40,  240] },
  5:  { name: 'L1',      label: 'Sapphire',    color: '#4dc3ff', emoji: '💎', tier: 'low',     payout: [null, null, null, null, null, null, null, null, 20,  20,  30,  30,  200] },
  6:  { name: 'L2',      label: 'Emerald',     color: '#4dffb8', emoji: '💚', tier: 'low',     payout: [null, null, null, null, null, null, null, null, 16,  16,  24,  24,  160] },
  7:  { name: 'L3',      label: 'Amethyst',    color: '#a44dff', emoji: '💜', tier: 'low',     payout: [null, null, null, null, null, null, null, null, 10,  10,  20,  20,  100] },
  8:  { name: 'L4',      label: 'Ruby',        color: '#ff4d6d', emoji: '❤️', tier: 'low',     payout: [null, null, null, null, null, null, null, null, 8,   8,   18,  18,  80] },
  9:  { name: 'L5',      label: 'Topaz',       color: '#c0c0c0', emoji: '🤍', tier: 'low',     payout: [null, null, null, null, null, null, null, null, 5,   5,   15,  15,  40] },
  10: { name: 'SCAT',    label: 'Celestial',   color: '#ffd700', emoji: '🌟', tier: 'scatter', payout: [null, null, null, null, 60, 100, 2000] },
  11: { name: 'Stack1',  label: 'Nebula',      color: '#00ffcc', emoji: '🌌', tier: 'special' },
  12: { name: 'Stack2',  label: 'Aurora',      color: '#ff00ff', emoji: '🎆', tier: 'special' },
  13: { name: 'BMB',     label: 'Supernova',   color: '#ff2020', emoji: '💥', tier: 'special' },
};

export const getSymbol = (id) =>
  CG_SYMBOLS[id] || { name: '?', label: 'Unknown', color: '#333', emoji: '?', tier: 'unknown' };

export const CG_BONUS_BUY_OPTIONS = [
  {
    id: 1,
    name: 'Buy Free Spins',
    cost: 100,
    desc: '15 Free Spins guaranteed — 4 Celestial scatters injected',
    highlight: true,
  },
];
