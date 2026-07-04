import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCGSocket, EVENTS, CG_GAME_CODE } from './socketClient';
import CelestialGrid from './CelestialGrid';
import BetControls from './BetControls';
import BuyBonusPanel from './BuyBonusPanel';
import { FreeSpinBadge, WinBanner, ScatterTrigger } from './FreeSpinOverlay';
import './CelestialGame.css';

const DEFAULT_PLAYER_ID = process.env.REACT_APP_CG_PLAYER_ID || process.env.REACT_APP_DH_PLAYER_ID || '6895e9e558a4fb592a3a2e70';
const DEFAULT_GAME_ID = process.env.REACT_APP_CG_GAME_ID || '68a575c25db8e6a18a88466c';

export default function CelestialGame() {
  const [playerId, setPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [gameId, setGameId] = useState(DEFAULT_GAME_ID);
  const [inputPlayerId, setInputPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [inputGameId, setInputGameId] = useState(DEFAULT_GAME_ID);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState('Guardian');
  const [board, setBoard] = useState(null);
  const [cascadeData, setCascadeData] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [coinValue, setCoinValue] = useState(0.1);
  const [lastWin, setLastWin] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [anteBet, setAnteBet] = useState(false);

  const [freeSpins, setFreeSpins] = useState({
    active: false, remaining: 0, total: 0, totalWon: 0, multiplier: 1,
  });
  const [autoplay, setAutoplay] = useState({ active: false, remaining: 0 });
  const [buyBonusOpen, setBuyBonusOpen] = useState(false);
  const [scatterTrigger, setScatterTrigger] = useState({ show: false, count: 0 });

  const [socketEvents, setSocketEvents] = useState([]);
  const [eventLogOpen, setEventLogOpen] = useState(false);
  const [eventLogExpanded, setEventLogExpanded] = useState({});

  const socketRef = useRef(null);
  const freeSpinTimerRef = useRef(null);

  const pushMsg = useCallback((msg, type = 'info') => {
    setMessages((prev) => [{ id: Date.now() + Math.random(), msg, type }, ...prev].slice(0, 8));
  }, []);

  const logEvent = useCallback((eventName, payload, direction = 'in') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false }) +
      '.' + String(Date.now() % 1000).padStart(3, '0');
    const arrow = direction === 'in' ? '←' : '→';
    console.log(`[CG Socket ${arrow} ${eventName}]`, payload);
    setSocketEvents((prev) =>
      [{ id: Date.now() + Math.random(), time, eventName, direction, payload }, ...prev].slice(0, 60)
    );
  }, []);

  const toggleEventExpand = (id) => {
    setEventLogExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearEventLog = () => {
    setSocketEvents([]);
    setEventLogExpanded({});
  };

  const handleConnect = () => {
    setPlayerId(inputPlayerId.trim() || DEFAULT_PLAYER_ID);
    setGameId(inputGameId.trim() || DEFAULT_GAME_ID);
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
    setBoard(null);
    setCascadeData([]);
  };

  useEffect(() => {
    if (!playerId) return;
    const socket = createCGSocket(playerId);
    socketRef.current = socket;

    socket.on(EVENTS.CONNECT, () => {
      logEvent(EVENTS.CONNECT, { socketId: socket.id });
      setConnected(true);
      setError(null);
      pushMsg('Connected to server', 'success');
    });

    socket.on(EVENTS.CONNECT_ACK, (data) => {
      logEvent(EVENTS.CONNECT_ACK, data);
      socket.emit(EVENTS.REQUEST_SLOT_INFO, { gameId, playerId });
      logEvent(EVENTS.REQUEST_SLOT_INFO, { gameId, playerId }, 'out');
    });

    socket.on(EVENTS.DISCONNECT, (reason) => {
      logEvent(EVENTS.DISCONNECT, { reason });
      setConnected(false);
      pushMsg('Disconnected', 'error');
    });

    socket.on(EVENTS.ERROR, (msg) => {
      logEvent(EVENTS.ERROR, msg);
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      pushMsg(typeof msg === 'string' ? msg : 'Error', 'error');
      setSpinning(false);
    });

    socket.on(EVENTS.SLOT_INFO, (info) => {
      logEvent(EVENTS.SLOT_INFO, info);
      if (typeof info.balance === 'number') setBalance(info.balance);
      if (info.username) setUsername(info.username);
      if (info.lastBoardState) setBoard(info.lastBoardState);
      if (typeof info.lastBet === 'number' && info.lastBet > 0) setCoinValue(info.lastBet);
      if (typeof info.freeSpins === 'number' && info.freeSpins > 0) {
        setFreeSpins((fs) => ({ ...fs, active: true, remaining: info.freeSpins, total: info.freeSpins }));
      }
      pushMsg('Slot info loaded', 'info');
    });

    socket.on(EVENTS.PLAY_RESULT, (result) => {
      logEvent(EVENTS.PLAY_RESULT, result);
      const state = result?.state;
      if (!state) return;

      if (state.board) setBoard(state.board);
      if (Array.isArray(state.cascadeData)) setCascadeData(state.cascadeData);

      // Update multiplier from free spin state
      if (typeof state.multiplier === 'number') {
        setFreeSpins((fs) => ({ ...fs, multiplier: state.multiplier }));
      }

      const win = state.winCurrency || 0;
      setLastWin(win);
      if (win > 0) setTotalWin((t) => t + win);

      if (result.user && typeof result.user.balance === 'number') {
        setBalance(result.user.balance);
      }

      // Detect scatter trigger for the wow-animation
      const scatterCount = state.scatterData?.count || 0;
      if (scatterCount >= 4 && state.freespinsData?.add > 0) {
        setScatterTrigger({ show: true, count: scatterCount });
      }

      const totalStepMs = (state.cascadeData?.length || 1) * 850 + 700;
      window.setTimeout(() => setSpinning(false), totalStepMs);
    });

    socket.on(EVENTS.FREE_SPIN_WON, (count) => {
      logEvent(EVENTS.FREE_SPIN_WON, { count });
      pushMsg(`🎉 Won ${count} Free Spins!`, 'success');
    });

    socket.on(EVENTS.FREE_SPIN_ROUND_STARTED, (info) => {
      logEvent(EVENTS.FREE_SPIN_ROUND_STARTED, info);
      setFreeSpins({
        active: true,
        remaining: info.remainingSpins || info.totalRounds || 0,
        total: info.totalRounds || info.remainingSpins || 0,
        totalWon: info.totalWon || 0,
        multiplier: 1,
      });
      pushMsg('Free Spin Round started', 'success');
      if (freeSpinTimerRef.current) clearTimeout(freeSpinTimerRef.current);
      freeSpinTimerRef.current = setTimeout(() => triggerFreeSpin(), 1500);
    });

    socket.on(EVENTS.FREE_SPIN_INFO, (info) => {
      logEvent(EVENTS.FREE_SPIN_INFO, info);
      setFreeSpins((fs) => ({
        ...fs,
        active: true,
        remaining: info.remainingSpins ?? fs.remaining,
        total: info.totalRounds ?? fs.total,
        totalWon: info.totalWon ?? fs.totalWon,
      }));
      if ((info.remainingSpins ?? 0) > 0) {
        if (freeSpinTimerRef.current) clearTimeout(freeSpinTimerRef.current);
        freeSpinTimerRef.current = setTimeout(() => triggerFreeSpin(), 1800);
      }
    });

    socket.on(EVENTS.FREE_SPIN_COMPLETED, (msg) => {
      logEvent(EVENTS.FREE_SPIN_COMPLETED, msg);
      setFreeSpins({ active: false, remaining: 0, total: 0, totalWon: 0, multiplier: 1 });
      pushMsg(msg || 'Free Spin Completed', 'info');
    });

    socket.on(EVENTS.AUTO_PLAY_INFO, (info) => {
      logEvent(EVENTS.AUTO_PLAY_INFO, info);
      setAutoplay({ active: true, remaining: info.remainingSpins || 0 });
      setTimeout(() => {
        socket.emit(EVENTS.NEXT_AUTO_PLAY_ROUND, { gameId });
        logEvent(EVENTS.NEXT_AUTO_PLAY_ROUND, { gameId }, 'out');
      }, 900);
    });

    socket.on(EVENTS.AUTO_PLAY_COMPLETED, (msg) => {
      logEvent(EVENTS.AUTO_PLAY_COMPLETED, msg);
      setAutoplay({ active: false, remaining: 0 });
      pushMsg(msg || 'Autoplay Completed', 'info');
    });

    socket.on(EVENTS.AUTO_PLAY_ERR, (msg) => {
      logEvent(EVENTS.AUTO_PLAY_ERR, msg);
      setAutoplay({ active: false, remaining: 0 });
      pushMsg(msg || 'Autoplay error', 'error');
    });

    socket.onAny((eventName, ...args) => {
      const known = Object.values(EVENTS);
      if (!known.includes(eventName)) {
        logEvent(eventName, args.length === 1 ? args[0] : args);
      }
    });

    return () => {
      if (freeSpinTimerRef.current) clearTimeout(freeSpinTimerRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, gameId]);

  const triggerFreeSpin = () => {
    const socket = socketRef.current;
    if (!socket) return;
    setSpinning(true);
    setCascadeData([]);
    setLastWin(0);
    const payload = { gameId };
    socket.emit(EVENTS.PLAY_FREE_SPIN_ROUND, payload);
    logEvent(EVENTS.PLAY_FREE_SPIN_ROUND, payload, 'out');
  };

  const handleSpin = () => {
    const socket = socketRef.current;
    if (!socket || !connected) {
      pushMsg('Not connected', 'error');
      return;
    }
    setSpinning(true);
    setCascadeData([]);
    setLastWin(0);
    const payload = {
      gameId,
      coin_value: coinValue,
      game_code: CG_GAME_CODE,
      type: anteBet ? 'premium_spin' : 'bet',
    };
    socket.emit(EVENTS.PLAY, payload);
    logEvent(EVENTS.PLAY, payload, 'out');
  };

  const handleStartAutoplay = (rounds) => {
    const socket = socketRef.current;
    if (!socket) return;
    setAutoplay({ active: true, remaining: rounds });
    const payload = {
      gameId,
      rounds,
      coin_value: coinValue,
      game_code: CG_GAME_CODE,
    };
    socket.emit(EVENTS.START_AUTO_PLAY, payload);
    logEvent(EVENTS.START_AUTO_PLAY, payload, 'out');
  };

  const handleCancelAutoplay = () => {
    const socket = socketRef.current;
    if (!socket) return;
    const payload = { gameId };
    socket.emit(EVENTS.CANCEL_AUTO_PLAY, payload);
    logEvent(EVENTS.CANCEL_AUTO_PLAY, payload, 'out');
    setAutoplay({ active: false, remaining: 0 });
  };

  const handleBuyBonus = (opt) => {
    const socket = socketRef.current;
    if (!socket) return;
    setBuyBonusOpen(false);
    setSpinning(true);
    setCascadeData([]);
    const payload = {
      gameId,
      coin_value: coinValue,
      game_code: CG_GAME_CODE,
      bonus_id: opt.id,
    };
    socket.emit(EVENTS.BUY_BONUS, payload);
    logEvent(EVENTS.BUY_BONUS, payload, 'out');
  };

  const handleToggleAnte = () => setAnteBet((v) => !v);

  return (
    <div className={`cg-root ${freeSpins.active ? 'cg-root-fs' : ''}`}>
      {/* Cosmic background */}
      <div className="cg-bg-cosmic" />

      <div className="cg-header">
        <div className="cg-title">
          <span className="cg-logo">🌌</span> Celestial Guardians
        </div>
        <div className="cg-status">
          <div className={`cg-conn ${connected ? 'cg-online' : 'cg-offline'}`}>
            ● {connected ? 'ONLINE' : 'OFFLINE'}
          </div>
          <div className="cg-user">👤 {username}</div>
          <div className="cg-balance">€ {balance.toFixed(2)}</div>
        </div>
      </div>

      {!connected && (
        <motion.div
          className="cg-login-panel"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="cg-login-title">Enter the Cosmos</div>
          <div className="cg-login-row">
            <label>Player ID</label>
            <input value={inputPlayerId} onChange={(e) => setInputPlayerId(e.target.value)} />
          </div>
          <div className="cg-login-row">
            <label>Game ID</label>
            <input value={inputGameId} onChange={(e) => setInputGameId(e.target.value)}
              placeholder="Celestial Guardians Mongo ObjectId" />
          </div>
          <button className="cg-connect-btn" onClick={handleConnect}>Connect</button>
          <div className="cg-hint">
            Socket: {process.env.REACT_APP_CG_SOCKET_URL || 'http://localhost:4033'}
          </div>
        </motion.div>
      )}

      {connected && (
        <motion.div
          className="cg-stage"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <FreeSpinBadge
            active={freeSpins.active}
            remaining={freeSpins.remaining}
            total={freeSpins.total}
            totalWon={freeSpins.totalWon}
            multiplier={freeSpins.multiplier}
          />

          <div className={`cg-grid-wrap ${freeSpins.active ? 'cg-grid-wrap-fs' : ''}`}>
            <CelestialGrid
              board={board}
              cascadeData={cascadeData}
              spinning={spinning}
              freeSpin={freeSpins.active}
              currentMultiplier={freeSpins.multiplier}
            />
            <WinBanner amount={lastWin} />
          </div>

          <div className="cg-hud">
            <div className="cg-hud-item"><span>Last Win</span><b>€ {lastWin.toFixed(2)}</b></div>
            <div className="cg-hud-item"><span>Session Win</span><b>€ {totalWin.toFixed(2)}</b></div>
            <div className="cg-hud-item"><span>Bet</span><b>€ {(coinValue * (anteBet ? 1.25 : 1)).toFixed(2)}</b></div>
          </div>

          <BetControls
            coinValue={coinValue}
            setCoinValue={setCoinValue}
            onSpin={handleSpin}
            onOpenBuyBonus={() => setBuyBonusOpen(true)}
            onToggleAnte={handleToggleAnte}
            anteBet={anteBet}
            onStartAutoplay={handleStartAutoplay}
            onCancelAutoplay={handleCancelAutoplay}
            spinning={spinning}
            autoplayActive={autoplay.active}
            autoplayRemaining={autoplay.remaining}
            freeSpinsActive={freeSpins.active}
            disabled={!connected}
          />

          <button className="cg-disconnect" onClick={handleDisconnect}>Disconnect</button>
        </motion.div>
      )}

      <BuyBonusPanel
        open={buyBonusOpen}
        onClose={() => setBuyBonusOpen(false)}
        onBuy={handleBuyBonus}
        coinValue={coinValue}
        balance={balance}
      />

      <ScatterTrigger
        show={scatterTrigger.show}
        scatterCount={scatterTrigger.count}
        onDone={() => setScatterTrigger({ show: false, count: 0 })}
      />

      <div className="cg-messages">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className={`cg-msg cg-msg-${m.type}`}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
            >
              {m.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {error && (
        <div className="cg-error-toast" onClick={() => setError(null)}>
          ⚠ {error} <small>(tap to dismiss)</small>
        </div>
      )}

      <div className={`cg-event-log ${eventLogOpen ? 'cg-open' : 'cg-collapsed'}`}>
        <div className="cg-event-log-header">
          <div className="cg-event-log-title">
            <span className="cg-event-dot" />
            Socket Event Log
            <span className="cg-event-count">({socketEvents.length})</span>
          </div>
          <div className="cg-event-log-actions">
            <button className="cg-event-btn" onClick={clearEventLog}>Clear</button>
            <button className="cg-event-btn" onClick={() => setEventLogOpen((o) => !o)}>
              {eventLogOpen ? '▼' : '▲'}
            </button>
          </div>
        </div>
        {eventLogOpen && (
          <div className="cg-event-list">
            {socketEvents.length === 0 && (
              <div className="cg-event-empty">Waiting for socket events…</div>
            )}
            {socketEvents.map((ev) => {
              const isExpanded = eventLogExpanded[ev.id];
              const preview =
                ev.payload == null ? 'null'
                  : typeof ev.payload === 'string' ? ev.payload
                    : JSON.stringify(ev.payload).slice(0, 90) +
                      (JSON.stringify(ev.payload).length > 90 ? '…' : '');
              return (
                <div
                  key={ev.id}
                  className={`cg-event-item cg-event-${ev.direction}`}
                  onClick={() => toggleEventExpand(ev.id)}
                >
                  <div className="cg-event-row">
                    <span className="cg-event-time">{ev.time}</span>
                    <span className={`cg-event-arrow cg-event-arrow-${ev.direction}`}>
                      {ev.direction === 'in' ? '←' : '→'}
                    </span>
                    <span className="cg-event-name">{ev.eventName}</span>
                    <span className="cg-event-preview">{preview}</span>
                  </div>
                  {isExpanded && (
                    <pre className="cg-event-json">
                      {ev.payload == null ? 'null'
                        : typeof ev.payload === 'string' ? ev.payload
                          : JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
