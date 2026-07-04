import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_CG_SOCKET_URL || process.env.REACT_APP_DH_SOCKET_URL || 'http://localhost:4033';

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
  GET_BONUS_INFO: 'GET_BONUS_INFO',
  BUY_BONUS: 'BUY_BONUS',
  GET_PREMIUM_SPIN_COST: 'GET_PREMIUM_SPIN_COST',
  PLAY_PREMIUM: 'PLAY_PREMIUM',
};

export function createCGSocket(playerId) {
  return io(SOCKET_URL, {
    query: { playerId },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

export const CG_GAME_CODE = 'celestial_guardians_96';
