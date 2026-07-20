// Agila Uprising — underworld / boxing arena theme (matches Jili original)
// Symbol IDs match backend wild_bounty engine:
//   0=WC(Wild)  1-4=High tier  5-8=Low tier
//   9=SC(Scatter)  10=BC(Bonus Coin)  11=SW(Sticky Wild — free game)
export const AG_SYMBOLS = {
  0:  { name: 'WILD',   label: 'Wild',        color: '#ffcc00', emoji: '⭐',  tier: 'wild' },
  1:  { name: 'GOLD',   label: 'Gold Bars',   color: '#ffcc00', emoji: '🟨', tier: 'high' },
  2:  { name: 'CASH',   label: 'Money Stack', color: '#4ade80', emoji: '💵', tier: 'high' },
  3:  { name: 'GUN',    label: 'Pistol',      color: '#94a3b8', emoji: '🔫', tier: 'high' },
  4:  { name: 'BAG',    label: 'Briefcase',   color: '#a0522d', emoji: '💼', tier: 'high' },
  5:  { name: 'RIFLE',  label: 'Assault',     color: '#78716c', emoji: '🎯', tier: 'low' },
  6:  { name: 'RADIO',  label: 'Walkie',      color: '#60a5fa', emoji: '📻', tier: 'low' },
  7:  { name: 'DYNM',   label: 'Dynamite',    color: '#dc2626', emoji: '🧨', tier: 'low' },
  8:  { name: 'KNIFE',  label: 'Blade',       color: '#cbd5e1', emoji: '🔪', tier: 'low' },
  9:  { name: 'SCAT',   label: 'Scatter',     color: '#ffcc00', emoji: '🛡️', tier: 'scatter' },
  // Wild Bounty reference features (available when backend routes to wild_bounty engine)
  10: { name: 'COIN',   label: 'Bonus Coin',  color: '#f59e0b', emoji: '🪙', tier: 'bonus' },
  11: { name: 'SWILD',  label: 'Sticky Wild', color: '#a855f7', emoji: '💠', tier: 'wild' },
};

export const getSymbol = (id) =>
  AG_SYMBOLS[id] || { name: '?', label: 'Empty', color: '#333', emoji: '?', tier: 'unknown' };

export const AG_BET_SIZES = [0.01, 0.02, 0.03, 0.05, 0.1, 0.2, 0.5, 1];
export const AG_BET_LEVELS = [1, 2, 3, 5, 10, 20, 50];

// Wild Bounty Enhancement R1 — Tiered Bonus Buy (GDD §4.2)
// 3 SKUs: Small (40×), Standard (100×, certified unchanged), Max (250×)
export const AG_BONUS_BUY_OPTIONS = [
  {
    id: 2,   // buy_bonus_id 2 → v96buy2 (Small)
    name: 'Small Buy',
    cost: 40,
    tier: 'small',
    desc: '~3-4 Sun Idols · ~8 Free Spins · Budget-friendly entry into the uprising.',
    highlight: false,
  },
  {
    id: 1,   // buy_bonus_id 1 → v96buy1 (Standard, certified)
    name: 'Standard Buy',
    cost: 100,
    tier: 'standard',
    desc: '~6.5 Sun Idols · ~17 Free Spins · The signature Uprising launch.',
    highlight: true,
  },
  {
    id: 3,   // buy_bonus_id 3 → v96buy3 (Max)
    name: 'Max Buy',
    cost: 250,
    tier: 'max',
    desc: '~6-8 Sun Idols · ~28 Free Spins · Denser goldens · Full pantheon fury.',
    highlight: false,
  },
];

// Wild Bounty Enhancement R1 — Player-Choice Free Spins (GDD §4.1)
// All 3 variants are EV-equal at 0.50892 — only volatility shape differs.
//
// spinsLabel MUST match backend common.js `variantSpins` exactly, else
// the pick modal misleads the player (was showing "~7" for RISKY when
// backend actually awards 5, per GDD §4.1 tuning method that converged
// RISKY to 5×16 to hit the mandatory 0.50892 EV target — the original
// "~7" spec was superseded during tuning).
export const AG_VARIANT_OPTIONS = [
  {
    id: 'RISKY',
    name: 'Risky',
    icon: '⚔️',
    spinsLabel: '5',
    startMult: 16,
    volatility: 'HIGHEST',
    color: '#ff4a3d',
    desc: 'Only 5 spins with ×16 starting multiplier — for the bold.',
  },
  {
    id: 'STABLE',
    name: 'Stable',
    icon: '🛡️',
    spinsLabel: '20',
    startMult: 4,
    volatility: 'LOWEST',
    color: '#3d7cff',
    desc: '20 spins with ×4 starting multiplier — steady wins.',
  },
  {
    id: 'MYSTERY',
    name: 'Mystery',
    icon: '❓',
    spinsLabel: '?',
    startMult: '?',
    volatility: 'MIXED',
    color: '#ba55d3',
    desc: 'Fate decides — Risky or Stable revealed at pick.',
  },
];

// Asymmetric grid: 3-4-5-5-4-3
export const AG_REEL_ROWS = [3, 4, 5, 5, 4, 3];
export const AG_MAX_ROWS = 5;

// Multiplier tiers for progress bar (doubles each cascade).
// Sequence must start at 1× — that is the base game's starting multiplier
// (see backend common.js `baseMultiplier = 1`). Cascades then double:
// 1 → 2 → 4 → 8 → 16 → 32 → 64 → 128 → 256 → 512 → 1024 (max cap).
// Free-spins seed higher (8× default, or per variant); progress bar
// window centers on the active tier so it still shows correctly.
export const AG_MULT_TIERS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
