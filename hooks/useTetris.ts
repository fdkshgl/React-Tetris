
import { useState, useCallback, useEffect } from 'react';
import { COLS, ROWS, getRandomTetromino, INITIAL_DROP_SPEED, MIN_DROP_SPEED, SPEED_INCREMENT, TETROMINOS } from '../constants';
import { Grid, ActivePiece, GameState, Position, Shape, Tetromino } from '../types';

const createEmptyGrid = (): Grid => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

export const useTetris = () => {
  const [gameState, setGameState] = useState<GameState>({
    grid: createEmptyGrid(),
    activePiece: null,
    nextPiece: getRandomTetromino(),
    heldPiece: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    isPaused: false,
  });

  const [dropSpeed, setDropSpeed] = useState<number | null>(INITIAL_DROP_SPEED);

  const checkCollision = useCallback((position: Position, shape: Shape, grid: Grid): boolean => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const newX = position.x + x;
          const newY = position.y + y;
          
          // Boundary checks
          if (
            newX < 0 || 
            newX >= COLS || 
            newY >= ROWS
          ) {
            return true;
          }
          
          // Grid collision check (ignore negative y as it's above the grid)
          if (newY >= 0 && grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const spawnPiece = useCallback((piece?: Tetromino) => {
    setGameState(prev => {
      const nextToSpawn = piece || prev.nextPiece;
      const startPos = { 
        x: Math.floor(COLS / 2) - Math.floor(nextToSpawn.shape[0].length / 2), 
        y: 0 
      };
      
      if (checkCollision(startPos, nextToSpawn.shape, prev.grid)) {
        return { ...prev, gameOver: true };
      }

      return {
        ...prev,
        activePiece: { tetromino: nextToSpawn, position: startPos },
        nextPiece: piece ? prev.nextPiece : getRandomTetromino(),
        canHold: true,
      };
    });
  }, [checkCollision]);

  const rotate = useCallback((shape: Shape): Shape => {
    return shape[0].map((_, index) => shape.map(col => col[index]).reverse());
  }, []);

  const handleRotate = useCallback(() => {
    setGameState(prev => {
      if (!prev.activePiece || prev.gameOver || prev.isPaused) return prev;
      const rotatedShape = rotate(prev.activePiece.tetromino.shape);
      
      // Basic wall kick (try moving left or right if rotation hits a wall)
      let offset = 0;
      if (checkCollision(prev.activePiece.position, rotatedShape, prev.grid)) {
        if (!checkCollision({ ...prev.activePiece.position, x: prev.activePiece.position.x - 1 }, rotatedShape, prev.grid)) {
          offset = -1;
        } else if (!checkCollision({ ...prev.activePiece.position, x: prev.activePiece.position.x + 1 }, rotatedShape, prev.grid)) {
          offset = 1;
        } else {
          return prev; // Cannot rotate
        }
      }

      return {
        ...prev,
        activePiece: {
          ...prev.activePiece,
          position: { ...prev.activePiece.position, x: prev.activePiece.position.x + offset },
          tetromino: { ...prev.activePiece.tetromino, shape: rotatedShape },
        },
      };
    });
  }, [rotate, checkCollision]);

  const move = useCallback((dir: { x: number; y: number }) => {
    setGameState(prev => {
      if (!prev.activePiece || prev.gameOver || prev.isPaused) return prev;
      
      const newPosition = {
        x: prev.activePiece.position.x + dir.x,
        y: prev.activePiece.position.y + dir.y,
      };

      const hasCollision = checkCollision(newPosition, prev.activePiece.tetromino.shape, prev.grid);

      if (!hasCollision) {
        return {
          ...prev,
          activePiece: { ...prev.activePiece, position: newPosition },
        };
      }

      // If moving down and collision occurs, lock the piece
      if (dir.y > 0) {
        const newGrid = prev.grid.map(row => [...row]);
        const { shape, color } = prev.activePiece.tetromino;
        const { x, y } = prev.activePiece.position;

        shape.forEach((row, rowIdx) => {
          row.forEach((value, colIdx) => {
            if (value !== 0) {
              const gridY = y + rowIdx;
              const gridX = x + colIdx;
              if (gridY >= 0 && gridY < ROWS) {
                newGrid[gridY][gridX] = color;
              }
            }
          });
        });

        // Clear lines
        let linesClearedCount = 0;
        const clearedGrid = newGrid.filter(row => {
          const isFull = row.every(cell => cell !== null);
          if (isFull) linesClearedCount++;
          return !isFull;
        });

        while (clearedGrid.length < ROWS) {
          clearedGrid.unshift(Array(COLS).fill(null));
        }

        const linePoints = [0, 100, 300, 500, 800];
        const newScore = prev.score + linePoints[linesClearedCount] * prev.level;
        const newTotalLines = prev.lines + linesClearedCount;
        const newLevel = Math.floor(newTotalLines / 10) + 1;

        return {
          ...prev,
          grid: clearedGrid,
          score: newScore,
          lines: newTotalLines,
          level: newLevel,
          activePiece: null, // Triggers spawnPiece in useEffect
        };
      }
      return prev;
    });
  }, [checkCollision]);

  const holdPiece = useCallback(() => {
    setGameState(prev => {
      if (!prev.activePiece || !prev.canHold || prev.gameOver || prev.isPaused) return prev;

      const currentType = prev.activePiece.tetromino.type;
      const newHeldPiece = TETROMINOS[currentType];
      
      if (!prev.heldPiece) {
        // First hold: move next piece to active
        const nextPiece = prev.nextPiece;
        const startPos = { 
          x: Math.floor(COLS / 2) - Math.floor(nextPiece.shape[0].length / 2), 
          y: 0 
        };
        
        return {
          ...prev,
          heldPiece: newHeldPiece,
          activePiece: { tetromino: nextPiece, position: startPos },
          nextPiece: getRandomTetromino(),
          canHold: false,
        };
      } else {
        // Swap hold: active piece becomes held, held becomes active
        const pieceFromHold = prev.heldPiece;
        const startPos = { 
          x: Math.floor(COLS / 2) - Math.floor(pieceFromHold.shape[0].length / 2), 
          y: 0 
        };
        
        return {
          ...prev,
          heldPiece: newHeldPiece,
          activePiece: { tetromino: pieceFromHold, position: startPos },
          canHold: false,
        };
      }
    });
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      grid: createEmptyGrid(),
      activePiece: null,
      nextPiece: getRandomTetromino(),
      heldPiece: null,
      canHold: true,
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      isPaused: false,
    });
    setDropSpeed(INITIAL_DROP_SPEED);
  }, []);

  // Update speed based on level
  useEffect(() => {
    const newSpeed = Math.max(MIN_DROP_SPEED, INITIAL_DROP_SPEED * Math.pow(SPEED_INCREMENT, gameState.level - 1));
    setDropSpeed(gameState.isPaused || gameState.gameOver ? null : newSpeed);
  }, [gameState.level, gameState.isPaused, gameState.gameOver]);

  // Handle automatic spawning when activePiece is cleared (locked)
  useEffect(() => {
    if (!gameState.activePiece && !gameState.gameOver && !gameState.isPaused) {
      spawnPiece();
    }
  }, [gameState.activePiece, gameState.gameOver, gameState.isPaused, spawnPiece]);

  return { gameState, move, handleRotate, holdPiece, togglePause, resetGame, dropSpeed };
};
