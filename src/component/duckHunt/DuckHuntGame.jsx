import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createDuckHuntSocket, EVENTS, GAME_CODE } from './socketClient';
import SlotGrid from './SlotGrid';
import BetControls from './BetControls';
import BonusBuyPanel from './BonusBuyPanel';
import FreeSpinOverlay, { PickModal, WinBanner } from './FreeSpinOverlay';
import './DuckHuntGame.css';

const DEFAULT_PLAYER_ID = process.env.REACT_APP_DH_PLAYER_ID || '6895e9e558a4fb592a3a2e70';
const DEFAULT_GAME_ID = process.env.REACT_APP_DH_GAME_ID || '68a5717d07e31d60ee5bebae';

export default function DuckHuntGame() {
  const [playerId, setPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [gameId, setGameId] = useState(DEFAULT_GAME_ID);
  const [inputPlayerId, setInputPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [inputGameId, setInputGameId] = useState(DEFAULT_GAME_ID);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState('Guest');
  const [board, setBoard] = useState(null);
  const [cascadeData, setCascadeData] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [coinValue, setCoinValue] = useState(0.1);
  const [lastWin, setLastWin] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  const [freeSpins, setFreeSpins] = useState({ active: false, remaining: 0, total: 0, totalWon: 0, features: [] });
  const [autoplay, setAutoplay] = useState({ active: false, remaining: 0 });
  const [buyBonusOpen, setBuyBonusOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);

  const [socketEvents, setSocketEvents] = useState([]);
  const [eventLogOpen, setEventLogOpen] = useState(true);
  const [eventLogExpanded, setEventLogExpanded] = useState({});

  const socketRef = useRef(null);
  const freeSpinTimerRef = useRef(null);

  const pushMsg = useCallback((msg, type = 'info') => {
    setMessages((prev) => [{ id: Date.now() + Math.random(), msg, type }, ...prev].slice(0, 8));
  }, []);

  const logEvent = useCallback((eventName, payload, direction = 'in') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0');
    const entry = {
      id: Date.now() + Math.random(),
      time,
      eventName,
      direction,
      payload,
    };
    // Console log
    const arrow = direction === 'in' ? '←' : '→';
    console.log(`[Socket ${arrow} ${eventName}]`, payload);
    setSocketEvents((prev) => [entry, ...prev].slice(0, 60));
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
    const socket = createDuckHuntSocket(playerId);
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

      const win = state.winCurrency || 0;
      setLastWin(win);
      if (win > 0) setTotalWin((t) => t + win);

      if (result.user && typeof result.user.balance === 'number') {
        setBalance(result.user.balance);
      }

      const totalStepMs = (state.cascadeData?.length || 1) * 650 + 400;
      window.setTimeout(() => {
        setSpinning(false);
      }, totalStepMs);
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
        features: info.features || [],
      });
      pushMsg('Free Spin Round started', 'success');
      if (freeSpinTimerRef.current) clearTimeout(freeSpinTimerRef.current);
      freeSpinTimerRef.current = setTimeout(() => triggerFreeSpin(), 1200);
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
        freeSpinTimerRef.current = setTimeout(() => triggerFreeSpin(), 1500);
      }
    });

    socket.on(EVENTS.FREE_SPIN_COMPLETED, (msg) => {
      logEvent(EVENTS.FREE_SPIN_COMPLETED, msg);
      setFreeSpins({ active: false, remaining: 0, total: 0, totalWon: 0, features: [] });
      pushMsg(msg || 'Free Spin Completed', 'info');
    });

    socket.on(EVENTS.AUTO_PLAY_INFO, (info) => {
      logEvent(EVENTS.AUTO_PLAY_INFO, info);
      setAutoplay({ active: true, remaining: info.remainingSpins || 0 });
      const timer = setTimeout(() => {
        socket.emit(EVENTS.NEXT_AUTO_PLAY_ROUND, { gameId });
        logEvent(EVENTS.NEXT_AUTO_PLAY_ROUND, { gameId }, 'out');
      }, 900);
      return () => clearTimeout(timer);
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

    socket.on(EVENTS.GET_PICK_REQUEST, (data) => {
      logEvent(EVENTS.GET_PICK_REQUEST, data);
      setPickOpen(true);
    });

    socket.on(EVENTS.GET_PICK_OPTION, (data) => {
      logEvent(EVENTS.GET_PICK_OPTION, data);
    });

    socket.on(EVENTS.GET_BONUS_INFO, (data) => {
      logEvent(EVENTS.GET_BONUS_INFO, data);
    });

    socket.on(EVENTS.ON_BET_INFO, (data) => {
      logEvent(EVENTS.ON_BET_INFO, data);
    });

    // Catch-all listener — logs ANY event we didn't register above
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
      game_code: GAME_CODE,
      type: 'bet',
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
      game_code: GAME_CODE,
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
      game_code: GAME_CODE,
      bonus_id: opt.id,
    };
    socket.emit(EVENTS.BUY_BONUS, payload);
    logEvent(EVENTS.BUY_BONUS, payload, 'out');
  };

  const handlePick = (choice) => {
    const socket = socketRef.current;
    if (!socket) return;
    setPickOpen(false);
    const payload = { gameId, player_choice: choice };
    socket.emit(EVENTS.SEND_PICK_CHOICE, payload);
    logEvent(EVENTS.SEND_PICK_CHOICE, payload, 'out');
  };

  return (
    <div className="dh-root">
      <div className="dh-header">
        <div className="dh-title">
          <span className="dh-logo">🦆</span> Duck Hunters: Happy Hour
        </div>
        <div className="dh-status">
          <div className={`dh-conn ${connected ? 'dh-online' : 'dh-offline'}`}>
            ● {connected ? 'ONLINE' : 'OFFLINE'}
          </div>
          <div className="dh-user">👤 {username}</div>
          <div className="dh-balance">€ {balance.toFixed(2)}</div>
        </div>
      </div>

      {!connected && (
        <div className="dh-login-panel">
          <div className="dh-login-title">Connect to Server</div>
          <div className="dh-login-row">
            <label>Player ID</label>
            <input value={inputPlayerId} onChange={(e) => setInputPlayerId(e.target.value)} />
          </div>
          <div className="dh-login-row">
            <label>Game ID</label>
            <input value={inputGameId} onChange={(e) => setInputGameId(e.target.value)} />
          </div>
          <button className="dh-connect-btn" onClick={handleConnect}>Connect</button>
          <div className="dh-hint">
            Socket URL: {process.env.REACT_APP_DH_SOCKET_URL || 'http://localhost:4033'}
          </div>
        </div>
      )}

      {connected && (
        <div className="dh-stage">
          <div className={`dh-grid-wrap ${freeSpins.active ? 'dh-grid-wrap-fs' : ''}`}>
            <SlotGrid
              board={board}
              cascadeData={cascadeData}
              spinning={spinning}
              freeSpin={freeSpins.active}
            />
            <FreeSpinOverlay
              active={freeSpins.active}
              remaining={freeSpins.remaining}
              total={freeSpins.total}
              totalWon={freeSpins.totalWon}
              features={freeSpins.features}
            />
            <WinBanner amount={lastWin} />
          </div>

          <div className="dh-hud">
            <div className="dh-hud-item"><span>Last Win</span><b>€ {lastWin.toFixed(2)}</b></div>
            <div className="dh-hud-item"><span>Session Win</span><b>€ {totalWin.toFixed(2)}</b></div>
            <div className="dh-hud-item"><span>Bet</span><b>€ {coinValue.toFixed(2)}</b></div>
          </div>

          <BetControls
            coinValue={coinValue}
            setCoinValue={setCoinValue}
            onSpin={handleSpin}
            onOpenBuyBonus={() => setBuyBonusOpen(true)}
            onStartAutoplay={handleStartAutoplay}
            onCancelAutoplay={handleCancelAutoplay}
            spinning={spinning}
            autoplayActive={autoplay.active}
            autoplayRemaining={autoplay.remaining}
            freeSpinsActive={freeSpins.active}
            disabled={!connected}
          />

          <button className="dh-disconnect" onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}

      <BonusBuyPanel
        open={buyBonusOpen}
        onClose={() => setBuyBonusOpen(false)}
        onBuy={handleBuyBonus}
        coinValue={coinValue}
        balance={balance}
      />

      <PickModal open={pickOpen} onPick={handlePick} />

      <div className="dh-messages">
        {messages.map((m) => (
          <div key={m.id} className={`dh-msg dh-msg-${m.type}`}>{m.msg}</div>
        ))}
      </div>

      {error && (
        <div className="dh-error-toast" onClick={() => setError(null)}>
          ⚠ {error} <small>(tap to dismiss)</small>
        </div>
      )}

      <div className={`dh-event-log ${eventLogOpen ? 'dh-open' : 'dh-collapsed'}`}>
        <div className="dh-event-log-header">
          <div className="dh-event-log-title">
            <span className="dh-event-dot" />
            Socket Event Log
            <span className="dh-event-count">({socketEvents.length})</span>
          </div>
          <div className="dh-event-log-actions">
            <button className="dh-event-btn" onClick={clearEventLog}>Clear</button>
            <button className="dh-event-btn" onClick={() => setEventLogOpen((o) => !o)}>
              {eventLogOpen ? '▼' : '▲'}
            </button>
          </div>
        </div>
        {eventLogOpen && (
          <div className="dh-event-list">
            {socketEvents.length === 0 && (
              <div className="dh-event-empty">Waiting for socket events…</div>
            )}
            {socketEvents.map((ev) => {
              const isExpanded = eventLogExpanded[ev.id];
              const preview =
                ev.payload == null
                  ? 'null'
                  : typeof ev.payload === 'string'
                    ? ev.payload
                    : JSON.stringify(ev.payload).slice(0, 90) +
                      (JSON.stringify(ev.payload).length > 90 ? '…' : '');
              return (
                <div
                  key={ev.id}
                  className={`dh-event-item dh-event-${ev.direction}`}
                  onClick={() => toggleEventExpand(ev.id)}
                >
                  <div className="dh-event-row">
                    <span className="dh-event-time">{ev.time}</span>
                    <span className={`dh-event-arrow dh-event-arrow-${ev.direction}`}>
                      {ev.direction === 'in' ? '←' : '→'}
                    </span>
                    <span className="dh-event-name">{ev.eventName}</span>
                    <span className="dh-event-preview">{preview}</span>
                  </div>
                  {isExpanded && (
                    <pre className="dh-event-json">
                      {ev.payload == null
                        ? 'null'
                        : typeof ev.payload === 'string'
                          ? ev.payload
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
