// Agila Uprising — underworld / boxing arena theme (matches Jili original)
export const AG_SYMBOLS = {
  0: { name: 'WILD',   label: 'Wild',        color: '#ffcc00', emoji: '⭐', tier: 'wild' },
  1: { name: 'GOLD',   label: 'Gold Bars',   color: '#ffcc00', emoji: '🟨', tier: 'high' },
  2: { name: 'CASH',   label: 'Money Stack', color: '#4ade80', emoji: '💵', tier: 'high' },
  3: { name: 'GUN',    label: 'Pistol',      color: '#94a3b8', emoji: '🔫', tier: 'high' },
  4: { name: 'BAG',    label: 'Briefcase',   color: '#a0522d', emoji: '💼', tier: 'high' },
  5: { name: 'RIFLE',  label: 'Assault',     color: '#78716c', emoji: '🎯', tier: 'low' },
  6: { name: 'RADIO',  label: 'Walkie',      color: '#60a5fa', emoji: '📻', tier: 'low' },
  7: { name: 'DYNM',   label: 'Dynamite',    color: '#dc2626', emoji: '🧨', tier: 'low' },
  8: { name: 'KNIFE',  label: 'Blade',       color: '#cbd5e1', emoji: '🔪', tier: 'low' },
  9: { name: 'SCAT',   label: 'Scatter',     color: '#ffcc00', emoji: '🛡️', tier: 'scatter' },
};

export const getSymbol = (id) =>
  AG_SYMBOLS[id] || { name: '?', label: 'Empty', color: '#333', emoji: '?', tier: 'unknown' };

export const AG_BET_SIZES = [0.01, 0.02, 0.03, 0.05, 0.1, 0.2, 0.5, 1];
export const AG_BET_LEVELS = [1, 2, 3, 5, 10, 20, 50];

export const AG_BONUS_BUY_OPTIONS = [
  {
    id: 1,
    name: 'Buy Bonus',
    cost: 100,
    desc: '10 Free Spins guaranteed — scatters injected. Free spins start at ×8 multiplier and double each cascade!',
    highlight: true,
  },
];

// Asymmetric grid: 3-4-5-5-4-3
export const AG_REEL_ROWS = [3, 4, 5, 5, 4, 3];
export const AG_MAX_ROWS = 5;

// Multiplier tiers for progress bar (doubles each cascade)
export const AG_MULT_TIERS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
