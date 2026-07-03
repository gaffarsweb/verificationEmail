import React, { useEffect, useState, useRef } from 'react';
import { getSymbol } from './symbols';

const REELS = 6;
const ROWS = 5;
const STEP_MS = 650;

function emptyBoard() {
  return Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => null));
}

function cellKey(c, r) { return `${c}-${r}`; }

function getMultiplierMap(positionMultipliers = []) {
  const map = {};
  for (const pm of positionMultipliers) {
    if (!pm || !pm.position) continue;
    map[cellKey(pm.position.col, pm.position.row)] = pm.multiplier;
  }
  return map;
}

function getWinPositionSet(currentCountWin = []) {
  const set = new Set();
  for (const win of currentCountWin) {
    for (const pos of win.positions || []) set.add(cellKey(pos.col, pos.row));
  }
  return set;
}

export default function SlotGrid({ board, cascadeData, spinning }) {
  const [displayBoard, setDisplayBoard] = useState(board || emptyBoard());
  const [winPositions, setWinPositions] = useState(new Set());
  const [multMap, setMultMap] = useState({});
  const [bombPositions, setBombPositions] = useState(new Set());
  const [cascadeIdx, setCascadeIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!cascadeData || cascadeData.length === 0) {
      setDisplayBoard(board || emptyBoard());
      setWinPositions(new Set());
      setMultMap({});
      setBombPositions(new Set());
      return;
    }

    let i = 0;
    const runStep = () => {
      const step = cascadeData[i];
      if (!step) return;
      setDisplayBoard(step.board);
      setWinPositions(getWinPositionSet(step.currentCountWin));
      setMultMap(getMultiplierMap(step.currentPositionMultiplier));
      const bombs = new Set();
      (step.bombState?.positions || []).forEach(p => bombs.add(cellKey(p.col, p.row)));
      setBombPositions(bombs);
      setCascadeIdx(i);

      i++;
      if (i < cascadeData.length) {
        timerRef.current = setTimeout(runStep, STEP_MS);
      }
    };
    runStep();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [cascadeData, board]);

  return (
    <div className={`dh-grid ${spinning ? 'dh-spinning' : ''}`}>
      {Array.from({ length: REELS }).map((_, col) => (
        <div className="dh-reel" key={`reel-${col}`}>
          {Array.from({ length: ROWS }).map((_, row) => {
            const sym = displayBoard?.[col]?.[row];
            const symInfo = sym != null ? getSymbol(sym) : null;
            const key = cellKey(col, row);
            const isWin = winPositions.has(key);
            const mult = multMap[key];
            const isBomb = bombPositions.has(key);
            return (
              <div
                key={`cell-${key}-${cascadeIdx}`}
                className={`dh-cell tier-${symInfo?.tier || 'empty'} ${isWin ? 'dh-win' : ''} ${isBomb ? 'dh-bomb-hit' : ''}`}
                style={{ background: symInfo ? `linear-gradient(160deg, ${symInfo.color}55, ${symInfo.color}22)` : 'transparent' }}
              >
                {symInfo && (
                  <>
                    <div className="dh-cell-emoji">{symInfo.emoji}</div>
                    <div className="dh-cell-name">{symInfo.name}</div>
                  </>
                )}
                {mult && <div className="dh-mult">x{mult}</div>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
