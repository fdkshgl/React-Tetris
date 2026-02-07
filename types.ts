
export type Shape = (number | string)[][];

export interface Tetromino {
  shape: Shape;
  color: string;
  type: string;
}

export type Grid = (string | null)[][];

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  grid: Grid;
  activePiece: ActivePiece | null;
  nextPiece: Tetromino;
  heldPiece: Tetromino | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

export interface ActivePiece {
  tetromino: Tetromino;
  position: Position;
}
