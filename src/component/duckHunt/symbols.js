export const SYMBOL_MAP = {
  0:  { name: 'WD',   label: 'Wild',        color: '#fff8dc', emoji: '🃏', tier: 'wild' },
  1:  { name: 'AA',   label: 'High 1',      color: '#ff4d4d', emoji: '🦅', tier: 'high' },
  2:  { name: 'BB',   label: 'High 2',      color: '#ff9a4d', emoji: '🦆', tier: 'high' },
  3:  { name: 'CC',   label: 'High 3',      color: '#ffd24d', emoji: '🐦', tier: 'high' },
  4:  { name: 'DD',   label: 'High 4',      color: '#a4ff4d', emoji: '🦉', tier: 'high' },
  5:  { name: 'EE',   label: 'Low 1',       color: '#4dc3ff', emoji: '♠',  tier: 'low' },
  6:  { name: 'FF',   label: 'Low 2',       color: '#4d7cff', emoji: '♥',  tier: 'low' },
  7:  { name: 'GG',   label: 'Low 3',       color: '#a04dff', emoji: '♦',  tier: 'low' },
  8:  { name: 'HH',   label: 'Low 4',       color: '#ff4de0', emoji: '♣',  tier: 'low' },
  9:  { name: 'II',   label: 'Low 5',       color: '#ffb0e0', emoji: '★',  tier: 'low' },
  10: { name: 'SCAT', label: 'Scatter',     color: '#ffd700', emoji: '🎯', tier: 'scatter' },
  11: { name: 'xW',   label: 'xWays',       color: '#00ffcc', emoji: '❓', tier: 'special' },
  12: { name: 'xIW',  label: 'InfectWays',  color: '#ff00ff', emoji: '☣', tier: 'special' },
  13: { name: 'BMB',  label: 'Bomb',        color: '#ff2020', emoji: '💣', tier: 'special' },
};

export const getSymbol = (id) => SYMBOL_MAP[id] || { name: '?', label: 'Unknown', color: '#333', emoji: '?', tier: 'unknown' };

export const BONUS_BUY_OPTIONS = [
  { id: 1, name: 'Duck Hunt Spins',  cost: 70,   desc: '7 Free Spins (1 upgrade)' },
  { id: 2, name: 'Hawk Eye Spins',   cost: 200,  desc: '8 Free Spins (2 upgrades)' },
  { id: 3, name: 'Big Game Spins',   cost: 600,  desc: '10 Free Spins (all 3 upgrades)' },
  { id: 4, name: 'Lucky Draw',       cost: 235,  desc: 'Random FS tier' },
  { id: 5, name: 'Bonus Booster',    cost: 2,    desc: 'Guaranteed SCAT on reel 2' },
  { id: 6, name: 'Day 8 Spins',      cost: 10,   desc: 'All positions x2 initial mult' },
  { id: 7, name: 'Day 64 Spins',     cost: 90,   desc: 'All positions x64 initial mult' },
  { id: 8, name: 'Happy Hour Spins', cost: 3000, desc: 'All positions x1024 initial mult' },
];
