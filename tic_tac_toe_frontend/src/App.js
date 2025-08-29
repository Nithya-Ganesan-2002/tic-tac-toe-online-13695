import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// Winning line combinations for Tic Tac Toe
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Calculate winner for a given board
function calculateWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

// Find a winning move for a player, if available
function findWinningMove(board, player) {
  for (const [a, b, c] of LINES) {
    const line = [board[a], board[b], board[c]];
    const empties = [a, b, c].filter((idx, i) => line[i] === null);
    const marks = line.filter((v) => v === player).length;
    if (empties.length === 1 && marks === 2) {
      return empties[0];
    }
  }
  return null;
}

// Simple heuristic AI: win > block > center > corner > side
function getAIMove(board) {
  const ai = 'O';
  const human = 'X';

  // Try to win
  const win = findWinningMove(board, ai);
  if (win !== null) return win;

  // Block human's win
  const block = findWinningMove(board, human);
  if (block !== null) return block;

  // Take center
  if (board[4] === null) return 4;

  // Take a corner
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // Take a side
  const sides = [1, 3, 5, 7].filter((i) => board[i] === null);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

  return null;
}

function Square({ value, onClick, highlight }) {
  return (
    <button
      className={`square ${value === 'X' ? 'x' : ''} ${value === 'O' ? 'o' : ''} ${highlight ? 'win' : ''}`}
      onClick={onClick}
      aria-label={`board cell ${value ?? 'empty'}`}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * React component rendering the Tic Tac Toe game.
   * Features:
   * - 2-player and single-player (vs. computer) modes
   * - Centered responsive board with minimalistic design
   * - Displays current player, player scores, and game status
   * - Win/draw detection and restart button
   * Returns a responsive, web-first UI using the specified color theme.
   */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameMode, setGameMode] = useState('cpu'); // 'cpu' | 'pvp'
  const [isGameOver, setIsGameOver] = useState(false);
  const [winningLine, setWinningLine] = useState(null);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  // Derived info
  const emptyCount = useMemo(() => board.filter((v) => v === null).length, [board]);

  // Handle a human move
  const handleClick = (index) => {
    if (board[index] !== null || isGameOver) return;

    // In CPU mode, human is 'X' and must only play when it's X turn
    if (gameMode === 'cpu' && !xIsNext) return;

    const nextBoard = [...board];
    nextBoard[index] = xIsNext ? 'X' : 'O';
    concludeTurn(nextBoard);
  };

  // Apply a move and conclude the turn (for both human and AI)
  const concludeTurn = (nextBoard) => {
    const { winner: w, line } = calculateWinner(nextBoard);

    setBoard(nextBoard);
    if (w) {
      setIsGameOver(true);
      setWinningLine(line);
      setWinner(w);
      setScores((s) => ({ ...s, [w]: s[w] + 1 }));
      return;
    }

    if (!nextBoard.includes(null)) {
      setIsGameOver(true);
      setWinningLine(null);
      setWinner(null);
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      return;
    }

    setXIsNext((prev) => !prev);
  };

  // AI move when it's O's turn in CPU mode
  useEffect(() => {
    if (gameMode !== 'cpu') return;
    if (isGameOver) return;
    if (xIsNext) return; // AI plays 'O'

    // Small delay to feel natural
    const t = setTimeout(() => {
      const idx = getAIMove(board);
      if (idx !== null) {
        const nextBoard = [...board];
        if (nextBoard[idx] === null) {
          nextBoard[idx] = 'O';
          concludeTurn(nextBoard);
        }
      }
    }, 450);

    return () => clearTimeout(t);
  }, [board, gameMode, xIsNext, isGameOver]);

  // PUBLIC_INTERFACE
  const restartGame = () => {
    /** Restarts the current game round, preserving scores. */
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setIsGameOver(false);
    setWinningLine(null);
    setWinner(null);
  };

  const changeMode = (mode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    // Reset game and scores when switching modes
    setScores({ X: 0, O: 0, draws: 0 });
    restartGame();
  };

  const statusMessage = useMemo(() => {
    if (isGameOver) {
      if (winner) {
        const who =
          gameMode === 'cpu' && winner === 'O'
            ? 'Computer (O)'
            : `Player ${winner}`;
        return `${who} wins!`;
      }
      return "It's a draw.";
    }
    if (gameMode === 'cpu' && !xIsNext) {
      return "Computer's turn...";
    }
    return `Next: ${xIsNext ? 'X' : 'O'}`;
  }, [isGameOver, winner, xIsNext, gameMode]);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title" aria-label="Tic Tac Toe heading">Tic Tac Toe</h1>

          <div className="top-row">
            <div className="mode-toggle" role="group" aria-label="Game mode">
              <button
                className={`mode-btn ${gameMode === 'cpu' ? 'active' : ''}`}
                onClick={() => changeMode('cpu')}
                aria-pressed={gameMode === 'cpu'}
              >
                1 Player
              </button>
              <button
                className={`mode-btn ${gameMode === 'pvp' ? 'active' : ''}`}
                onClick={() => changeMode('pvp')}
                aria-pressed={gameMode === 'pvp'}
              >
                2 Players
              </button>
            </div>

            <button className="btn restart" onClick={restartGame} aria-label="Restart game">
              Restart
            </button>
          </div>

          <div className="scores" aria-label="Scores">
            <div className="score chip x">X: {scores.X}</div>
            <div className="score chip draws">Draws: {scores.draws}</div>
            <div className="score chip o">O: {scores.O}</div>
          </div>

          <div className="current">
            Current:
            <span className={`pill ${xIsNext ? 'x' : 'o'}`}>
              {xIsNext ? 'X' : 'O'}
              {gameMode === 'cpu' && !xIsNext ? ' (Computer)' : ''}
            </span>
          </div>
        </header>

        <main className="main">
          <div className="board" role="grid" aria-label="Tic Tac Toe board">
            {board.map((val, idx) => (
              <Square
                key={idx}
                value={val}
                onClick={() => handleClick(idx)}
                highlight={Array.isArray(winningLine) && winningLine.includes(idx)}
              />
            ))}
          </div>
        </main>

        <footer className="footer">
          <div className="status" aria-live="polite">{statusMessage}</div>
        </footer>
      </div>
    </div>
  );
}

export default App;
