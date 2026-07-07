import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createAGSocket, EVENTS, AG_GAME_CODE } from './socketClient';
import AgilaGrid from './AgilaGrid';
import BetControls from './BetControls';
import BuyBonusPanel from './BuyBonusPanel';
import MultiplierProgressBar from './MultiplierProgressBar';
import { FreeSpinBadge, WinBanner, ScatterTrigger } from './FreeSpinOverlay';
import VariantPickModal from './VariantPickModal';
import DuelAnimation from './DuelAnimation';
import './AgilaGame.css';

const DEFAULT_PLAYER_ID =
  process.env.REACT_APP_AG_PLAYER_ID ||
  process.env.REACT_APP_DH_PLAYER_ID ||
  '6895e9e558a4fb592a3a2e70';
const DEFAULT_GAME_ID = process.env.REACT_APP_AG_GAME_ID || '68a575815db8e6a18a884638';

export default function AgilaGame() {
  const [playerId, setPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [gameId, setGameId] = useState(DEFAULT_GAME_ID);
  const [inputPlayerId, setInputPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [inputGameId, setInputGameId] = useState(DEFAULT_GAME_ID);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState('Warrior');
  const [board, setBoard] = useState(null);
  const [goldenFramePositions, setGoldenFramePositions] = useState([]);
  const [cascadeData, setCascadeData] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [betSize, setBetSize] = useState(0.03);
  const [betLevel, setBetLevel] = useState(1);
  const [lastWin, setLastWin] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  const [freeSpins, setFreeSpins] = useState({
    active: false, remaining: 0, total: 0, totalWon: 0, multiplier: 8,
  });
  const [autoplay, setAutoplay] = useState({ active: false, remaining: 0 });
  const [buyBonusOpen, setBuyBonusOpen] = useState(false);
  const [scatterTrigger, setScatterTrigger] = useState({ show: false, count: 0, freeSpins: 0 });
  const [turboMode, setTurboMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [currentCascadeMult, setCurrentCascadeMult] = useState(1);

  const [socketEvents, setSocketEvents] = useState([]);
  const [eventLogOpen, setEventLogOpen] = useState(false);
  const [eventLogExpanded, setEventLogExpanded] = useState({});

  // Wild Bounty Enhancement R1 state
  const [duelState, setDuelState] = useState({ show: false, outcome: null });
  const [pickModalOpen, setPickModalOpen] = useState(false);
  const [pendingPickGameId, setPendingPickGameId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const socketRef = useRef(null);
  const freeSpinTimerRef = useRef(null);
  const pendingDuelRef = useRef(null);  // Holds duel outcome until modal shows
  const fsSessionActiveRef = useRef(false); // Tracks if we're already in FS session (prevents ScatterTrigger re-firing on retriggers)
  const nextFsStartDelayRef = useRef(1600); // Dynamic delay before first FS spin fires (extended when cascade + scatter trigger sequence pending)
  const pickModalOpenTargetRef = useRef(0);  // Absolute ms timestamp when pick modal should open (set by playResult, consumed by GET_PICK_REQUEST)
  const pickModalTimerRef = useRef(null);    // Handle for pending setTimeout that opens pick modal

  const totalBet = betSize * betLevel;

  const pushMsg = useCallback((msg, type = 'info') => {
    setMessages((prev) => [{ id: Date.now() + Math.random(), msg, type }, ...prev].slice(0, 8));
  }, []);

  const logEvent = useCallback((eventName, payload, direction = 'in') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false }) +
      '.' + String(Date.now() % 1000).padStart(3, '0');
    const arrow = direction === 'in' ? '←' : '→';
    console.log(`[Agila ${arrow} ${eventName}]`, payload);
    setSocketEvents((prev) =>
      [{ id: Date.now() + Math.random(), time, eventName, direction, payload }, ...prev].slice(0, 60)
    );
  }, []);

  const toggleEventExpand = (id) =>
    setEventLogExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const clearEventLog = () => { setSocketEvents([]); setEventLogExpanded({}); };

  const handleConnect = () => {
    setPlayerId(inputPlayerId.trim() || DEFAULT_PLAYER_ID);
    setGameId(inputGameId.trim() || DEFAULT_GAME_ID);
  };
  const handleDisconnect = () => {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    setConnected(false); setBoard(null); setCascadeData([]);
  };

  useEffect(() => {
    if (!playerId) return;
    const socket = createAGSocket(playerId);
    socketRef.current = socket;

    socket.on(EVENTS.CONNECT, () => {
      logEvent(EVENTS.CONNECT, { socketId: socket.id });
      setConnected(true); setError(null);
      pushMsg('Uprising Connected', 'success');
    });

    socket.on(EVENTS.CONNECT_ACK, (data) => {
      logEvent(EVENTS.CONNECT_ACK, data);
      socket.emit(EVENTS.REQUEST_SLOT_INFO, { gameId, playerId });
      logEvent(EVENTS.REQUEST_SLOT_INFO, { gameId, playerId }, 'out');
    });

    socket.on(EVENTS.DISCONNECT, (reason) => {
      logEvent(EVENTS.DISCONNECT, { reason });
      setConnected(false); pushMsg('Disconnected', 'error');
    });

    socket.on(EVENTS.ERROR, (msg) => {
      logEvent(EVENTS.ERROR, msg);
      const errText = typeof msg === 'string' ? msg : (msg?.message || JSON.stringify(msg));
      setError(errText);
      pushMsg(errText, 'error');

      // Full reset — any spin/FS/buy in flight is now dead. Bring UI back
      // to a clean, interactable base state so the player isn't stuck.
      setSpinning(false);
      setBuyBonusOpen(false);
      setPickModalOpen(false);
      setDuelState({ show: false, outcome: null });
      setScatterTrigger({ show: false, count: 0, freeSpins: 0 });
      pendingDuelRef.current = null;
      if (freeSpinTimerRef.current) {
        clearTimeout(freeSpinTimerRef.current);
        freeSpinTimerRef.current = null;
      }
      if (pickModalTimerRef.current) {
        clearTimeout(pickModalTimerRef.current);
        pickModalTimerRef.current = null;
      }
      nextFsStartDelayRef.current = 1600;
      pickModalOpenTargetRef.current = 0;

      // Auto-dismiss error banner after 6 seconds (unless user taps to dismiss)
      window.setTimeout(() => setError((cur) => (cur === errText ? null : cur)), 6000);
    });

    socket.on(EVENTS.SLOT_INFO, (info) => {
      logEvent(EVENTS.SLOT_INFO, info);
      if (typeof info.balance === 'number') setBalance(info.balance);
      if (info.username) setUsername(info.username);
      if (info.lastBoardState) setBoard(info.lastBoardState);
      if (typeof info.bet_size === 'number' && info.bet_size > 0) setBetSize(info.bet_size);
      if (typeof info.bet_level === 'number' && info.bet_level > 0) setBetLevel(info.bet_level);
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
      if (Array.isArray(state.goldenFramePositions)) setGoldenFramePositions(state.goldenFramePositions);
      if (Array.isArray(state.cascadeData)) setCascadeData(state.cascadeData);

      // Track final multiplier for progress bar
      if (typeof state.multiplier === 'number') {
        setCurrentCascadeMult(state.multiplier);
        setFreeSpins((fs) => ({ ...fs, multiplier: state.multiplier }));
      } else if (Array.isArray(state.cascadeData) && state.cascadeData.length) {
        const lastMult = state.cascadeData[state.cascadeData.length - 1]?.currentMultiplier;
        if (typeof lastMult === 'number') setCurrentCascadeMult(lastMult);
      }

      const win = state.winCurrency || 0;
      setLastWin(win);
      if (win > 0) setTotalWin((t) => t + win);

      if (result.user && typeof result.user.balance === 'number') setBalance(result.user.balance);

      const scatterCount = state.scatterData?.count || 0;
      const fsAdd = state.freespinsData?.add || 0;
      const willTriggerScatter =
        scatterCount >= 3 && fsAdd > 0 && !fsSessionActiveRef.current;

      // Wild Bounty Enhancement R1 — capture variant selection state
      if (state.selectedVariant) {
        setSelectedVariant(state.selectedVariant);
      }
      // Capture duel outcome from base spin (server pre-drew it)
      if (state.duelData?.outcome) {
        pendingDuelRef.current = state.duelData.outcome;
      }

      // Cascade animation duration — buy trigger spin has more cascades due to
      // guaranteed scatter symbols + wins that burst. Player must SEE the spin
      // resolve fully before any overlay pops up.
      const totalStepMs = (state.cascadeData?.length || 1) * 900 + 800;
      window.setTimeout(() => setSpinning(false), totalStepMs);

      // Defer ScatterTrigger overlay until AFTER cascade animation finishes,
      // so the buy trigger spin is fully visible before the "AGILA UPRISING"
      // hero appears. Only fires on FIRST FS entry — not on retriggers.
      if (willTriggerScatter) {
        fsSessionActiveRef.current = true;   // Lock the session immediately
        window.setTimeout(() => {
          setScatterTrigger({ show: true, count: scatterCount, freeSpins: fsAdd });
        }, totalStepMs + 200);   // +200ms breathing room after final burst
        // Push out the FS start delay: cascade + trigger reveal + 2s hero + 500ms buffer
        nextFsStartDelayRef.current = totalStepMs + 200 + 2000 + 500;
      } else {
        // Normal FS spin timing (no trigger animation queued)
        nextFsStartDelayRef.current = 1600;
      }

      // If this playResult routes to variant pick (nextAction='pick'), the
      // server will fire GET_PICK_REQUEST immediately. Store a target time
      // so the pick modal only opens AFTER the cascade animation completes.
      if (state.nextAction === 'pick') {
        pickModalOpenTargetRef.current = Date.now() + totalStepMs + 200;
      }
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
        multiplier: 8,
      });
      pushMsg('Uprising Free Spins started', 'success');
      if (freeSpinTimerRef.current) clearTimeout(freeSpinTimerRef.current);
      // Delay is set dynamically by playResult handler based on cascade length
      // + whether scatter trigger overlay is being shown. This ensures buy
      // trigger spin's cascade + hero animation both complete before FS starts.
      const startDelay = nextFsStartDelayRef.current || 1600;
      nextFsStartDelayRef.current = 1600;   // Reset to default for next round
      freeSpinTimerRef.current = setTimeout(() => triggerFreeSpin(), startDelay);
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
        freeSpinTimerRef.current = setTimeout(() => triggerFreeSpin(), 1900);
      }
    });

    socket.on(EVENTS.FREE_SPIN_COMPLETED, (msg) => {
      logEvent(EVENTS.FREE_SPIN_COMPLETED, msg);
      setFreeSpins({ active: false, remaining: 0, total: 0, totalWon: 0, multiplier: 8 });
      // Reset session flag so next natural FS entry shows the trigger overlay again
      fsSessionActiveRef.current = false;
      pushMsg(msg || 'Free Spins Completed', 'info');
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

    // Wild Bounty Enhancement R1 — Cosmetic Duel (GDD §4.4)
    // Server pre-draws outcome and pushes it here. Non-math visual only.
    socket.on(EVENTS.DUEL_VIS_INFO, (payload) => {
      logEvent(EVENTS.DUEL_VIS_INFO, payload);
      const outcome = payload?.outcome || pendingDuelRef.current || 'HERO';
      pendingDuelRef.current = outcome;
      setDuelState({ show: true, outcome });
      pushMsg('⚔️ Standoff begins...', 'info');
    });

    // Wild Bounty Enhancement R1 — Variant Pick (GDD §4.1)
    // Server signals pick required. Wait for cascade animation + optional duel
    // to complete before opening the modal. Otherwise the modal covers the
    // buy trigger spin / natural cascade before the player sees it resolve.
    socket.on(EVENTS.GET_PICK_REQUEST, (payload) => {
      logEvent(EVENTS.GET_PICK_REQUEST, payload);
      const gid = payload?.gameId || gameId;
      setPendingPickGameId(gid);
      // Cancel any auto-FS-start that might have queued
      if (freeSpinTimerRef.current) {
        clearTimeout(freeSpinTimerRef.current);
        freeSpinTimerRef.current = null;
      }
      // If duel is showing (natural FS entry with duelEnabled), duel plays
      // out and handleDuelComplete opens the pick modal — nothing to do here.
      if (pendingDuelRef.current) return;

      // Otherwise (bought entry OR duel disabled), defer modal until cascade
      // finishes so the buy trigger spin remains fully visible.
      if (pickModalTimerRef.current) clearTimeout(pickModalTimerRef.current);
      const target = pickModalOpenTargetRef.current || 0;
      const delay = Math.max(0, target - Date.now());
      pickModalTimerRef.current = setTimeout(() => {
        setPickModalOpen(true);
        pickModalTimerRef.current = null;
      }, delay);
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
      bet_size: betSize,
      bet_level: betLevel,
      game_code: AG_GAME_CODE,
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
      gameId, rounds,
      coin_value: totalBet,
      bet_size: betSize,
      bet_level: betLevel,
      game_code: AG_GAME_CODE,
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
      bet_size: betSize,
      bet_level: betLevel,
      game_code: AG_GAME_CODE,
      bonus_id: opt.id,
    };
    socket.emit(EVENTS.BUY_BONUS, payload);
    logEvent(EVENTS.BUY_BONUS, payload, 'out');
  };

  // Wild Bounty Enhancement R1 — Duel completion callback.
  // When cosmetic animation ends, open the variant pick modal.
  const handleDuelComplete = useCallback(() => {
    setDuelState({ show: false, outcome: pendingDuelRef.current });
    if (pendingPickGameId) {
      setPickModalOpen(true);
    }
  }, [pendingPickGameId]);

  // Player picks a variant → emit SEND_PICK_CHOICE, close modal,
  // clear pending duel. Server will process pick and auto-start FS.
  const handleVariantPick = useCallback((variantId) => {
    const socket = socketRef.current;
    if (!socket) return;
    const payload = {
      gameId: pendingPickGameId || gameId,
      player_choice: variantId,
    };
    socket.emit(EVENTS.SEND_PICK_CHOICE, payload);
    logEvent(EVENTS.SEND_PICK_CHOICE, payload, 'out');
    setPickModalOpen(false);
    setPendingPickGameId(null);
    setSelectedVariant(variantId);
    pendingDuelRef.current = null;
    pushMsg(`Path chosen: ${variantId}`, 'success');
  }, [gameId, pendingPickGameId, logEvent, pushMsg]);

  return (
    <div className={`ag-root ${freeSpins.active ? 'ag-root-fs' : ''}`}>
      {/* Cinematic arena backdrop */}
      <div className="ag-arena-bg" />
      <div className="ag-arena-crowd" />
      <div className="ag-arena-vignette" />

      {/* Top-right scoreboard */}
      <div className="ag-scoreboard">
        <div className="ag-scoreboard-val">{lastWin.toFixed(1)}</div>
        <div className="ag-scoreboard-sep">|</div>
        <div className="ag-scoreboard-val">{totalWin.toFixed(1)}</div>
      </div>

      {/* Top-left connection/user status (mini) */}
      <div className="ag-topbar-mini">
        <div className={`ag-conn ${connected ? 'ag-online' : 'ag-offline'}`}>
          ● {connected ? username : 'OFFLINE'}
        </div>
      </div>

      {!connected && (
        <motion.div
          className="ag-login-panel"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="ag-login-title">🦅 AGILA UPRISING</div>
          <div className="ag-login-row">
            <label>Player ID</label>
            <input value={inputPlayerId} onChange={(e) => setInputPlayerId(e.target.value)} />
          </div>
          <div className="ag-login-row">
            <label>Game ID</label>
            <input
              value={inputGameId}
              onChange={(e) => setInputGameId(e.target.value)}
              placeholder="Agila Uprising Mongo ObjectId"
            />
          </div>
          <button className="ag-connect-btn" onClick={handleConnect}>ENTER THE UPRISING</button>
          <div className="ag-hint">
            Socket: {process.env.REACT_APP_AG_SOCKET_URL || 'http://localhost:4033'}
          </div>
        </motion.div>
      )}

      {connected && (
        <motion.div
          className="ag-stage-arena"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Left character panel */}
          <div className="ag-char-panel ag-char-left">
            <div className="ag-char-silhouette ag-char-male" />
          </div>

          {/* Center game panel */}
          <div className="ag-game-center">
            {/* Top multiplier progression bar */}
            <MultiplierProgressBar
              currentMultiplier={freeSpins.active ? freeSpins.multiplier : currentCascadeMult}
            />

            {/* Free spin badge (floating top) */}
            <FreeSpinBadge
              active={freeSpins.active}
              remaining={freeSpins.remaining}
              total={freeSpins.total}
              totalWon={freeSpins.totalWon}
              multiplier={freeSpins.multiplier}
            />

            {/* Ornate gold grid frame */}
            <div className={`ag-grid-frame ${freeSpins.active ? 'ag-grid-frame-fs' : ''}`}>
              <div className="ag-frame-corner ag-frame-tl" />
              <div className="ag-frame-corner ag-frame-tr" />
              <div className="ag-frame-corner ag-frame-bl" />
              <div className="ag-frame-corner ag-frame-br" />

              <div className="ag-grid-inner">
                <AgilaGrid
                  board={board}
                  cascadeData={cascadeData}
                  spinning={spinning}
                  freeSpin={freeSpins.active}
                  currentMultiplier={freeSpins.multiplier}
                  goldenFramePositions={goldenFramePositions}
                />
              </div>
              <WinBanner amount={lastWin} />
            </div>

            {/* Buy Bonus button below grid */}
            <motion.button
              className="ag-buy-bonus-cta"
              onClick={() => setBuyBonusOpen(true)}
              disabled={spinning || autoplay.active || freeSpins.active}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="ag-buy-bonus-glow" />
              <span className="ag-buy-bonus-text">BUY BONUS</span>
            </motion.button>

            {/* Bottom control bar */}
            <BetControls
              betSize={betSize}
              setBetSize={setBetSize}
              betLevel={betLevel}
              setBetLevel={setBetLevel}
              balance={balance}
              onSpin={handleSpin}
              onStartAutoplay={handleStartAutoplay}
              onCancelAutoplay={handleCancelAutoplay}
              spinning={spinning}
              autoplayActive={autoplay.active}
              autoplayRemaining={autoplay.remaining}
              freeSpinsActive={freeSpins.active}
              turboMode={turboMode}
              onToggleTurbo={() => setTurboMode((v) => !v)}
              disabled={!connected}
            />
          </div>

          {/* Right character panel + icon column */}
          <div className="ag-char-panel ag-char-right">
            <div className="ag-char-silhouette ag-char-female" />
            <div className="ag-icon-column">
              <button
                className={`ag-icon-btn ${soundOn ? 'ag-icon-on' : ''}`}
                onClick={() => setSoundOn((v) => !v)}
                title="Sound"
              >
                {soundOn ? '🔊' : '🔇'}
              </button>
              <button
                className="ag-icon-btn"
                onClick={() => pushMsg('History — coming soon', 'info')}
                title="History"
              >
                🕐
              </button>
              <button
                className="ag-icon-btn"
                onClick={() => pushMsg('Paytable — coming soon', 'info')}
                title="Paytable"
              >
                📖
              </button>
              <button
                className="ag-icon-btn"
                onClick={() => pushMsg('Menu — coming soon', 'info')}
                title="Menu"
              >
                ☰
              </button>
            </div>
          </div>

          <button className="ag-disconnect" onClick={handleDisconnect}>Disconnect</button>
        </motion.div>
      )}

      <BuyBonusPanel
        open={buyBonusOpen}
        onClose={() => setBuyBonusOpen(false)}
        onBuy={handleBuyBonus}
        totalBet={totalBet}
        balance={balance}
      />

      <ScatterTrigger
        show={scatterTrigger.show}
        scatterCount={scatterTrigger.count}
        freeSpinCount={scatterTrigger.freeSpins}
        onDone={() => setScatterTrigger({ show: false, count: 0, freeSpins: 0 })}
      />

      {/* Wild Bounty Enhancement R1 — Cosmetic Duel + Variant Pick */}
      <DuelAnimation
        show={duelState.show}
        outcome={duelState.outcome}
        onComplete={handleDuelComplete}
      />
      <VariantPickModal
        open={pickModalOpen}
        onPick={handleVariantPick}
        duelOutcome={pendingDuelRef.current}
      />

      <div className="ag-messages">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className={`ag-msg ag-msg-${m.type}`}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
            >
              {m.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            key={error}
            className="ag-error-banner"
            initial={{ y: -80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => setError(null)}
          >
            <div className="ag-error-icon">⚠️</div>
            <div className="ag-error-body">
              <div className="ag-error-title">{
                /insufficient/i.test(error) ? 'Insufficient Balance' :
                /invalid/i.test(error) ? 'Invalid Request' :
                /bonus/i.test(error) ? 'Bonus Purchase Failed' :
                /free spin/i.test(error) ? 'Free Spin Error' :
                /not found|not exist/i.test(error) ? 'Not Available' :
                'Error'
              }</div>
              <div className="ag-error-msg">{error}</div>
            </div>
            <button
              className="ag-error-close"
              onClick={(e) => { e.stopPropagation(); setError(null); }}
              aria-label="Dismiss error"
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`ag-event-log ${eventLogOpen ? 'ag-open' : 'ag-collapsed'}`}>
        <div className="ag-event-log-header">
          <div className="ag-event-log-title">
            <span className="ag-event-dot" />
            Socket Event Log
            <span className="ag-event-count">({socketEvents.length})</span>
          </div>
          <div className="ag-event-log-actions">
            <button className="ag-event-btn" onClick={clearEventLog}>Clear</button>
            <button className="ag-event-btn" onClick={() => setEventLogOpen((o) => !o)}>
              {eventLogOpen ? '▼' : '▲'}
            </button>
          </div>
        </div>
        {eventLogOpen && (
          <div className="ag-event-list">
            {socketEvents.length === 0 && (
              <div className="ag-event-empty">Waiting for socket events…</div>
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
                  className={`ag-event-item ag-event-${ev.direction}`}
                  onClick={() => toggleEventExpand(ev.id)}
                >
                  <div className="ag-event-row">
                    <span className="ag-event-time">{ev.time}</span>
                    <span className={`ag-event-arrow ag-event-arrow-${ev.direction}`}>
                      {ev.direction === 'in' ? '←' : '→'}
                    </span>
                    <span className="ag-event-name">{ev.eventName}</span>
                    <span className="ag-event-preview">{preview}</span>
                  </div>
                  {isExpanded && (
                    <pre className="ag-event-json">
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
