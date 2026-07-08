import { io } from 'socket.io-client';

// Single-port backend: Express REST + Socket.io on same port.
// Production Render URL used as fallback; env var can override for local dev.
const SOCKET_URL = process.env.REACT_APP_DH_SOCKET_URL || 'https://slot-games-services.onrender.com';

export const EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ACK: 'connect_ack',
  REQUEST_SLOT_INFO: 'requestSlotInfo',
  SLOT_INFO: 'slotInfo',
  PLAY: 'play',
  PLAY_RESULT: 'playResult',
  TO_BET_INFO: 'to_bet_info',
  ON_BET_INFO: 'on_bet_info',
  START_AUTO_PLAY: 'START_AUTO_PLAY',
  CANCEL_AUTO_PLAY: 'CANCEL_AUTO_PLAY',
  AUTO_PLAY_COMPLETED: 'AUTO_PLAY_COMPLETED',
  AUTO_PLAY_INFO: 'AUTO_PLAY_INFO',
  NEXT_AUTO_PLAY_ROUND: 'NEXT_AUTO_PLAY_ROUND',
  AUTO_PLAY_ERR: 'AUTO_PLAY_ERORR_STOPPED_NEEDED',
  START_FREE_SPIN_ROUND: 'START_FREE_SPIN_ROUND',
  FREE_SPIN_ROUND_STARTED: 'FREE_SPIN_ROUND_STARTED',
  PLAY_FREE_SPIN_ROUND: 'PLAY_FREE_SPIN_ROUND',
  FREE_SPIN_COMPLETED: 'FREE_SPIN_COMPLETED',
  FREE_SPIN_WON: 'FREE_SPIN_WON',
  FREE_SPIN_INFO: 'FREE_SPIN_INFO',
  GET_PICK_REQUEST: 'GET_PICK_REQUEST',
  SEND_PICK_CHOICE: 'SEND_PICK_CHOICE',
  GET_PICK_OPTION: 'GET_PICK_OPTION',
  GET_BONUS_INFO: 'GET_BONUS_INFO',
  BUY_BONUS: 'BUY_BONUS',
};

export function createDuckHuntSocket(playerId) {
  return io(SOCKET_URL, {
    query: { playerId },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

export const GAME_CODE = 'duck_hunt_96';
