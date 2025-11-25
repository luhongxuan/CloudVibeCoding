import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmType, GridDimensions, Coordinate, AlgoStep, GameResult, DIRECTIONS } from './types';
import * as Algorithms from './services/algorithms';
import Grid from './components/Grid';
import { Play, RotateCcw, Award, Settings, Info, ArrowRight, User, Bot } from 'lucide-react';

// --- Constants ---
const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 20;
const INITIAL_START: Coordinate = { row: 0, col: 0 };
const TICK_RATE_MS = 50; // Speed of algorithm visualization

// --- Helper: Random Goal ---
const generateGoal = (dims: GridDimensions, start: Coordinate): Coordinate => {
  let r, c;
  do {
    r = Math.floor(Math.random() * dims.rows);
    c = Math.floor(Math.random() * dims.cols);
  } while (r === start.row && c === start.col);
  return { row: r, col: c };
};

// --- Educational Texts ---
const ALGO_DESCRIPTIONS: Record<AlgorithmType, string> = {
  'BFS': "Breadth-First Search: Explores equally in all directions. Guarantees the shortest path in an unweighted grid by visiting nodes level-by-level.",
  'DFS': "Depth-First Search: Explores as far as possible along each branch before backtracking. Does NOT guarantee shortest path and can get lost in large grids.",
  'Dijkstra': "Dijkstra's Algorithm: Prioritizes nodes with the smallest known distance from the start. Identical to BFS on unweighted grids but handles weights.",
  'A*': "A* Search: Uses a heuristic (Manhattan distance) to estimate cost to the goal. Prioritizes exploration towards the target, often visiting far fewer nodes."
};

const App: React.FC = () => {
  // --- State ---
  const [dimensions, setDimensions] = useState<GridDimensions>({ rows: DEFAULT_ROWS, cols: DEFAULT_COLS });
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('BFS');
  const [gameStatus, setGameStatus] = useState<'SETUP' | 'PLAYING' | 'FINISHED'>('SETUP');
  
  // Game Entities
  const [goalPos, setGoalPos] = useState<Coordinate>({ row: 0, col: 0 }); // Placeholder
  const [startPos] = useState<Coordinate>(INITIAL_START);
  
  // Player State
  const [playerPos, setPlayerPos] = useState<Coordinate>(INITIAL_START);
  const [playerPath, setPlayerPath] = useState<Set<string>>(new Set(['0,0'])); // Visited cells history
  const [playerSteps, setPlayerSteps] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Algorithm State
  const [algoHistory, setAlgoHistory] = useState<AlgoStep[]>([]);
  const [algoStepIndex, setAlgoStepIndex] = useState(0);
  const [algoFinished, setAlgoFinished] = useState(false);
  
  // Results
  const [winner, setWinner] = useState<'PLAYER' | 'ALGORITHM' | 'DRAW' | null>(null);

  // --- Refs ---
  const timerRef = useRef<number | null>(null);
  const algoTimerRef = useRef<number | null>(null);

  // --- Logic: Start Game ---
  const startGame = () => {
    // 1. Setup Grid
    const newGoal = generateGoal(dimensions, startPos);
    setGoalPos(newGoal);
    setPlayerPos({ ...startPos });
    setPlayerPath(new Set([`${startPos.row},${startPos.col}`]));
    setPlayerSteps(0);
    setElapsedTime(0);
    setWinner(null);
    setAlgoFinished(false);

    // 2. Run Algorithm Pre-calculation
    let history: AlgoStep[] = [];
    switch (selectedAlgo) {
      case 'BFS': history = Algorithms.runBFS(dimensions, startPos, newGoal); break;
      case 'DFS': history = Algorithms.runDFSRecursive(dimensions, startPos, newGoal); break;
      case 'Dijkstra': history = Algorithms.runDijkstra(dimensions, startPos, newGoal); break;
      case 'A*': history = Algorithms.runAStar(dimensions, startPos, newGoal); break;
    }
    setAlgoHistory(history);
    setAlgoStepIndex(0);

    // 3. Start State
    setGameStatus('PLAYING');
    setStartTime(Date.now());
  };

  // --- Logic: Timer Loop ---
  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 100);

      // Algorithm Tick
      algoTimerRef.current = window.setInterval(() => {
        setAlgoStepIndex(prev => {
          if (prev < algoHistory.length - 1) {
            return prev + 1;
          } else {
            // Algo finished animation
            if (!algoFinished) setAlgoFinished(true);
            return prev;
          }
        });
      }, TICK_RATE_MS);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (algoTimerRef.current) clearInterval(algoTimerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (algoTimerRef.current) clearInterval(algoTimerRef.current);
    };
  }, [gameStatus, algoHistory, startTime, algoFinished]);

  // --- Logic: Check Win Conditions ---
  const checkWin = useCallback((isPlayerMove: boolean) => {
    // Check if both are done
    const isPlayerAtGoal = playerPos.row === goalPos.row && playerPos.col === goalPos.col;
    const isAlgoAtGoal = algoHistory.length > 0 && algoStepIndex >= algoHistory.length - 1;

    // We only end game if PLAYER reaches goal. 
    // If algo reaches first, game continues until player finishes or gives up (but we track who won).
    
    if (isPlayerAtGoal) {
      setGameStatus('FINISHED');
      if (isAlgoAtGoal) {
        // Tie breaker logic based on steps? Or just who finished in real time?
        // Simple: If algo finished previously, algo wins.
        if (algoFinished) setWinner('ALGORITHM');
        else setWinner('PLAYER');
      } else {
        setWinner('PLAYER');
      }
    } else if (isAlgoAtGoal && !algoFinished) {
      setAlgoFinished(true);
    }
  }, [playerPos, goalPos, algoHistory, algoStepIndex, algoFinished]);

  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      checkWin(false);
    }
  }, [algoStepIndex, gameStatus, checkWin]);

  // --- Logic: Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'PLAYING') return;

      let dRow = 0;
      let dCol = 0;
      if (e.key === 'ArrowUp' || e.key === 'w') dRow = -1;
      else if (e.key === 'ArrowDown' || e.key === 's') dRow = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a') dCol = -1;
      else if (e.key === 'ArrowRight' || e.key === 'd') dCol = 1;
      else return;

      const newR = playerPos.row + dRow;
      const newC = playerPos.col + dCol;

      if (newR >= 0 && newR < dimensions.rows && newC >= 0 && newC < dimensions.cols) {
        const nextPos = { row: newR, col: newC };
        setPlayerPos(nextPos);
        setPlayerSteps(prev => prev + 1);
        
        setPlayerPath(prev => {
          const nextSet = new Set(prev);
          nextSet.add(`${newR},${newC}`);
          return nextSet;
        });

        if (newR === goalPos.row && newC === goalPos.col) {
            // Check win inside the event loop for instant feedback
             if (algoFinished) setWinner('ALGORITHM');
             else setWinner('PLAYER');
             setGameStatus('FINISHED');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, playerPos, dimensions, goalPos, algoFinished]);


  // --- Helper: Get Current Algo Snapshot ---
  const currentAlgoStep = algoHistory[algoStepIndex] || { 
    visited: new Set(), 
    frontier: new Set(), 
    path: [] 
  };

  // Convert Algo Path array to Set for O(1) rendering
  const algoPathSet = new Set<string>();
  if (currentAlgoStep.path) {
    currentAlgoStep.path.forEach(p => algoPathSet.add(`${p.row},${p.col}`));
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* Header / Stats Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Settings size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Pathfinding Battle</h1>
                <p className="text-xs text-slate-500">Human vs {selectedAlgo}</p>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm font-medium">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Player Steps</span>
                <span className="text-xl font-mono text-blue-600">{playerSteps}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Time</span>
                <span className="text-xl font-mono">{elapsedTime.toFixed(1)}s</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Algo Nodes</span>
                <span className="text-xl font-mono text-purple-600">{currentAlgoStep.visited.size}</span>
              </div>
            </div>

            {gameStatus === 'SETUP' && (
              <button 
                onClick={startGame}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-indigo-200 transition-transform active:scale-95"
              >
                <Play size={18} /> Start
              </button>
            )}
            
            {(gameStatus === 'PLAYING' || gameStatus === 'FINISHED') && (
              <button 
                onClick={() => setGameStatus('SETUP')}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-full font-bold transition-colors"
              >
                <RotateCcw size={18} /> Reset
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:py-8 grid gap-8">
        
        {/* Setup Panel */}
        {gameStatus === 'SETUP' && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="text-indigo-500" /> Game Configuration
             </h2>
             
             <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <label className="block">
                   <span className="text-sm font-bold text-slate-700">Grid Size</span>
                   <div className="flex gap-4 mt-2">
                     <select 
                       className="p-2 bg-slate-50 border border-slate-300 rounded-lg flex-1"
                       value={dimensions.rows}
                       onChange={(e) => setDimensions(d => ({...d, rows: Number(e.target.value)}))}
                     >
                        <option value={10}>Small (10 rows)</option>
                        <option value={15}>Medium (15 rows)</option>
                        <option value={20}>Large (20 rows)</option>
                     </select>
                     <span className="self-center font-mono text-slate-400">x</span>
                     <select 
                       className="p-2 bg-slate-50 border border-slate-300 rounded-lg flex-1"
                       value={dimensions.cols}
                       onChange={(e) => setDimensions(d => ({...d, cols: Number(e.target.value)}))}
                     >
                        <option value={10}>Small (10 cols)</option>
                        <option value={20}>Medium (20 cols)</option>
                        <option value={25}>Large (25 cols)</option>
                     </select>
                   </div>
                 </label>

                 <label className="block">
                   <span className="text-sm font-bold text-slate-700">Select Opponent Algorithm</span>
                   <div className="grid grid-cols-2 gap-2 mt-2">
                     {(['BFS', 'DFS', 'Dijkstra', 'A*'] as AlgorithmType[]).map(algo => (
                       <button
                         key={algo}
                         onClick={() => setSelectedAlgo(algo)}
                         className={`p-3 rounded-lg text-sm font-bold border transition-all text-left ${
                           selectedAlgo === algo 
                             ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200' 
                             : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                         }`}
                       >
                         {algo}
                       </button>
                     ))}
                   </div>
                 </label>
               </div>

               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                   <Info size={16} /> About {selectedAlgo}
                 </h3>
                 <p className="text-sm text-slate-600 leading-relaxed">
                   {ALGO_DESCRIPTIONS[selectedAlgo]}
                 </p>
                 <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">How to Play</p>
                    <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                      <li>Use <b>WASD</b> or <b>Arrow Keys</b> to move the blue player.</li>
                      <li>Find the hidden red flag before the algorithm does.</li>
                      <li>Start position is top-left (0,0).</li>
                    </ul>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* Game Area */}
        {gameStatus !== 'SETUP' && (
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Player View */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <h3 className="font-bold text-blue-700 flex items-center gap-2">
                  <User size={18} /> You (Human)
                </h3>
                <span className="text-xs text-slate-500">Goal Hidden</span>
              </div>
              <div className="relative group">
                <Grid
                  dimensions={dimensions}
                  playerPos={playerPos}
                  startPos={startPos}
                  goalPos={goalPos}
                  isPlayerGrid={true}
                  visited={playerPath} // Player visited
                  frontier={new Set()}
                  path={new Set()}
                  revealGoal={gameStatus === 'FINISHED'}
                />
                {/* Mobile controls overlay hints could go here */}
              </div>
            </div>

            {/* Algorithm View */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <h3 className="font-bold text-purple-700 flex items-center gap-2">
                  <Bot size={18} /> Opponent ({selectedAlgo})
                </h3>
                <span className="text-xs text-slate-500">
                  {algoFinished ? "Finished" : "Computing..."}
                </span>
              </div>
              <div className="relative">
                <Grid
                  dimensions={dimensions}
                  algoCurrent={currentAlgoStep.current}
                  startPos={startPos}
                  goalPos={goalPos}
                  isPlayerGrid={false}
                  visited={currentAlgoStep.visited}
                  frontier={currentAlgoStep.frontier}
                  path={algoPathSet}
                  revealGoal={true}
                  recursionDepth={currentAlgoStep.depth}
                />
                {/* Legend Overlay */}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[10px] p-2 rounded border border-slate-200 shadow-sm space-y-1 opacity-50 hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div> Current</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-300 rounded-sm"></div> Frontier</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Visited</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-sm"></div> Path</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Results Modal / Overlay */}
        {gameStatus === 'FINISHED' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className={`p-6 text-center ${winner === 'PLAYER' ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>
                <div className="inline-flex p-3 rounded-full bg-white/20 mb-4">
                   <Award size={48} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-wide">
                  {winner === 'PLAYER' ? 'You Won!' : 'Algorithm Won!'}
                </h2>
                <p className="text-white/80 mt-1">
                  {winner === 'PLAYER' 
                    ? `Great job! You beat ${selectedAlgo} to the goal.` 
                    : `${selectedAlgo} found the optimal path faster.`}
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 text-center mb-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-500 text-xs uppercase mb-1">Your Path</h4>
                    <p className="text-2xl font-bold text-blue-600">{playerSteps} <span className="text-sm text-slate-400 font-normal">steps</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-500 text-xs uppercase mb-1">{selectedAlgo} Path</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {currentAlgoStep.path ? currentAlgoStep.path.length : 'N/A'} <span className="text-sm text-slate-400 font-normal">steps</span>
                    </p>
                  </div>
                </div>

                {/* Analysis */}
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg mb-6 text-sm text-amber-900">
                   <h5 className="font-bold mb-1 flex items-center gap-2"><Info size={14}/> Analysis</h5>
                   <p>
                     {selectedAlgo === 'BFS' && "BFS guarantees the shortest path. If you took more steps than the algorithm, your path wasn't fully optimal."}
                     {selectedAlgo === 'A*' && "A* is highly efficient because it 'guesses' direction. Notice how it explored fewer nodes than BFS would have."}
                     {selectedAlgo === 'DFS' && "DFS can get lucky or unlucky depending on the goal location. It doesn't guarantee the shortest path."}
                     {selectedAlgo === 'Dijkstra' && "On this unweighted grid, Dijkstra behaves like BFS, expanding in a perfect circle to find the shortest path."}
                   </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={startGame}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-transform active:scale-95"
                  >
                    Play Again <ArrowRight size={18} />
                  </button>
                  <button 
                    onClick={() => setGameStatus('SETUP')}
                    className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Change Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;