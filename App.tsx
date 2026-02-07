
import React, { useEffect, useState, useCallback } from 'react';
import { useTetris } from './hooks/useTetris';
import { useInterval } from './hooks/useInterval';
import { COLS, ROWS } from './constants';
import { getGeminiAdvice } from './services/geminiService';

const App: React.FC = () => {
  const { gameState, move, handleRotate, holdPiece, togglePause, resetGame, dropSpeed } = useTetris();
  const [aiAdvice, setAiAdvice] = useState<string>("ゲームを開始してアドバイスをもらおう！");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Auto drop
  useInterval(() => {
    if (!gameState.isPaused && !gameState.gameOver) {
      move({ x: 0, y: 1 });
    }
  }, dropSpeed);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameOver) return;
      
      switch (e.key.toLowerCase()) {
        case 'arrowleft':
          move({ x: -1, y: 0 });
          break;
        case 'arrowright':
          move({ x: 1, y: 0 });
          break;
        case 'arrowdown':
          move({ x: 0, y: 1 });
          break;
        case 'arrowup':
          handleRotate();
          break;
        case 'c':
          holdPiece();
          break;
        case 'p':
          togglePause();
          break;
        case ' ': // Hard drop space
          e.preventDefault();
          // Fast move to bottom
          // (Implementation could be refined but move loop is effective)
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, handleRotate, holdPiece, togglePause, gameState.gameOver]);

  const requestAdvice = useCallback(async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    const advice = await getGeminiAdvice(gameState.grid, gameState.nextPiece, gameState.score);
    setAiAdvice(advice);
    setIsAiLoading(false);
  }, [gameState.grid, gameState.nextPiece, gameState.score, isAiLoading]);

  // Render Cell
  const renderGrid = () => {
    const gridToRender = gameState.grid.map(row => [...row]);
    
    if (gameState.activePiece) {
      const { shape, color } = gameState.activePiece.tetromino;
      const { x, y } = gameState.activePiece.position;
      
      shape.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (cell !== 0) {
            const gridY = y + rowIdx;
            const gridX = x + colIdx;
            if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
              gridToRender[gridY][gridX] = color;
            }
          }
        });
      });
    }

    return gridToRender.map((row, y) => (
      row.map((color, x) => (
        <div
          key={`${y}-${x}`}
          className={`w-full h-full border-[0.5px] border-slate-200/50 rounded-sm ${color || 'bg-slate-100'}`}
          style={{
            boxShadow: color ? 'inset 0 0 8px rgba(0,0,0,0.1), 0 0 4px rgba(0,0,0,0.05)' : 'none'
          }}
        />
      ))
    ));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white overflow-hidden text-slate-900">
      <header className="mb-4 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
          React Tetris
        </h1>
        <p className="text-slate-400 text-xs tracking-widest font-bold">MINIMALIST EDITION</p>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 items-start justify-center max-w-6xl w-full">
        {/* Left Side: HOLD & SCORE */}
        <section className="flex flex-row lg:flex-col gap-4 w-full lg:w-48 order-2 lg:order-1">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1">
            <h2 className="text-xs text-slate-500 uppercase tracking-tighter mb-2 font-bold">Hold</h2>
            <div className="grid grid-cols-4 gap-1 w-24 h-24 mx-auto items-center justify-center">
              {gameState.heldPiece ? (
                gameState.heldPiece.shape.map((row, y) => 
                  row.map((cell, x) => (
                    <div key={`held-${y}-${x}`} className={`w-full h-full rounded-sm ${cell !== 0 ? gameState.heldPiece!.color : 'bg-transparent'}`} />
                  ))
                )
              ) : (
                <div className="col-span-4 text-center text-[10px] text-slate-300 italic">Empty</div>
              )}
            </div>
            <button 
              onClick={holdPiece}
              disabled={!gameState.canHold || gameState.gameOver || gameState.isPaused}
              className="mt-2 w-full py-1 text-[10px] uppercase font-bold text-blue-600 bg-white border border-blue-100 rounded-md hover:bg-blue-50 disabled:opacity-30 transition-colors"
            >
              Hold (C)
            </button>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Score</p>
              <p className="text-2xl font-bold text-blue-600">{gameState.score.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Level</p>
              <p className="text-2xl font-bold text-indigo-600">{gameState.level}</p>
            </div>
          </div>
        </section>

        {/* Center: Main Game Board */}
        <section className="relative group order-1 lg:order-2">
          <div 
            className="tetris-grid grid grid-cols-10 border-4 border-slate-200 rounded-lg overflow-hidden"
            style={{ width: '300px', height: '600px' }}
          >
            {renderGrid()}
          </div>

          {/* Game Over Overlay */}
          {gameState.gameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg animate-in fade-in zoom-in duration-300">
              <h2 className="text-4xl font-bold text-red-600 mb-4">GAME OVER</h2>
              <button 
                onClick={resetGame}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {/* Pause Overlay */}
          {gameState.isPaused && !gameState.gameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
              <h2 className="text-3xl font-bold text-blue-600 mb-4 tracking-widest">PAUSED</h2>
              <button 
                onClick={togglePause}
                className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl shadow-lg"
              >
                <i className="fas fa-play ml-1"></i>
              </button>
            </div>
          )}
        </section>

        {/* Right Side: Next & AI Coach */}
        <section className="flex flex-col gap-4 w-full lg:w-72 order-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h2 className="text-xs text-slate-500 uppercase tracking-tighter mb-2 font-bold">Next</h2>
            <div className="grid grid-cols-4 gap-1 w-24 h-24 mx-auto items-center justify-center">
              {gameState.nextPiece.shape.map((row, y) => 
                row.map((cell, x) => (
                  <div key={`next-${y}-${x}`} className={`w-full h-full rounded-sm ${cell !== 0 ? gameState.nextPiece.color : 'bg-transparent'}`} />
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h2 className="text-xs text-slate-500 uppercase font-bold">AI Coach Advice</h2>
            </div>
            <p className="text-sm italic text-slate-600 min-h-[4rem] leading-relaxed">
              "{isAiLoading ? "思考中..." : aiAdvice}"
            </p>
            <button 
              onClick={requestAdvice}
              disabled={isAiLoading || gameState.gameOver}
              className="mt-3 w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-50 text-xs rounded-lg transition-colors flex items-center justify-center gap-2 font-bold shadow-sm"
            >
              <i className="fas fa-robot text-blue-500"></i>
              アドバイスを聞く
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h2 className="text-xs text-slate-500 uppercase mb-4 font-bold">Controls</h2>
            <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <div className="flex items-center gap-2 text-xs">
                <kbd className="px-2 py-1 bg-white rounded border border-slate-200 shadow-sm font-sans">↑</kbd> <span>Rotate</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <kbd className="px-2 py-1 bg-white rounded border border-slate-200 shadow-sm font-sans">↓</kbd> <span>Soft Drop</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <kbd className="px-2 py-1 bg-white rounded border border-slate-200 shadow-sm font-sans">←→</kbd> <span>Move</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <kbd className="px-2 py-1 bg-white rounded border border-slate-200 shadow-sm font-sans">C</kbd> <span>Hold Piece</span>
              </div>
            </div>
          </div>

          {/* Mobile Buttons */}
          <div className="lg:hidden grid grid-cols-3 gap-2 mt-4 h-32">
            <button onPointerDown={() => move({x: -1, y: 0})} className="bg-slate-100 active:bg-slate-200 rounded-lg flex items-center justify-center text-xl shadow-sm border border-slate-200"><i className="fas fa-arrow-left"></i></button>
            <div className="flex flex-col gap-2">
                <button onPointerDown={handleRotate} className="flex-1 bg-blue-500 active:bg-blue-600 text-white rounded-lg flex items-center justify-center text-xl shadow-md"><i className="fas fa-rotate"></i></button>
                <button onPointerDown={() => move({x: 0, y: 1})} className="flex-1 bg-slate-100 active:bg-slate-200 rounded-lg flex items-center justify-center text-xl shadow-sm border border-slate-200"><i className="fas fa-arrow-down"></i></button>
            </div>
            <button onPointerDown={() => move({x: 1, y: 0})} className="bg-slate-100 active:bg-slate-200 rounded-lg flex items-center justify-center text-xl shadow-sm border border-slate-200"><i className="fas fa-arrow-right"></i></button>
          </div>
        </section>
      </main>

      <footer className="mt-8 text-slate-400 text-[10px] tracking-widest uppercase font-bold">
        Use Arrow Keys or C to Play
      </footer>
    </div>
  );
};

export default App;
