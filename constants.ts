
import { Tetromino } from './types';

export const COLS = 10;
export const ROWS = 20;
export const INITIAL_DROP_SPEED = 800;
export const MIN_DROP_SPEED = 100;
export const SPEED_INCREMENT = 0.9;

export const TETROMINOS: Record<string, Tetromino> = {
  I: {
    type: 'I',
    shape: [
      [0, 0, 0, 0],
      ['I', 'I', 'I', 'I'],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'bg-cyan-400',
  },
  J: {
    type: 'J',
    shape: [
      ['J', 0, 0],
      ['J', 'J', 'J'],
      [0, 0, 0],
    ],
    color: 'bg-blue-600',
  },
  L: {
    type: 'L',
    shape: [
      [0, 0, 'L'],
      ['L', 'L', 'L'],
      [0, 0, 0],
    ],
    color: 'bg-orange-500',
  },
  O: {
    type: 'O',
    shape: [
      ['O', 'O'],
      ['O', 'O'],
    ],
    color: 'bg-yellow-400',
  },
  S: {
    type: 'S',
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0],
    ],
    color: 'bg-green-500',
  },
  T: {
    type: 'T',
    shape: [
      [0, 'T', 0],
      ['T', 'T', 'T'],
      [0, 0, 0],
    ],
    color: 'bg-purple-500',
  },
  Z: {
    type: 'Z',
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0],
    ],
    color: 'bg-red-500',
  },
};

export const getRandomTetromino = (): Tetromino => {
  const keys = Object.keys(TETROMINOS);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[randomKey] };
};
