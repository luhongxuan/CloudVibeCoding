import React, { memo } from 'react';
import { Coordinate, GridDimensions } from '../types';
import { User, Flag, Bot } from 'lucide-react';

interface GridProps {
  dimensions: GridDimensions;
  playerPos?: Coordinate; // Only for player grid
  algoCurrent?: Coordinate; // Only for algo grid
  startPos: Coordinate;
  goalPos: Coordinate;
  isPlayerGrid: boolean;
  visited: Set<string>;
  frontier: Set<string>;
  path: Set<string>; // Set of strings for O(1) lookup
  revealGoal: boolean; // True for algo, false for player (until end)
  algorithmType?: string;
  recursionDepth?: number; // Visual aid for DFS
}

const Grid: React.FC<GridProps> = memo(({
  dimensions,
  playerPos,
  algoCurrent,
  startPos,
  goalPos,
  isPlayerGrid,
  visited,
  frontier,
  path,
  revealGoal,
  recursionDepth
}) => {
  const cells = [];
  const totalCells = dimensions.rows * dimensions.cols;

  // Pre-calculate string keys for rendering loop optimization
  const startKey = `${startPos.row},${startPos.col}`;
  const goalKey = `${goalPos.row},${goalPos.col}`;

  for (let r = 0; r < dimensions.rows; r++) {
    for (let c = 0; c < dimensions.cols; c++) {
      const key = `${r},${c}`;
      
      const isStart = key === startKey;
      const isGoal = key === goalKey;
      const isPlayer = playerPos && playerPos.row === r && playerPos.col === c;
      const isAlgoCurrent = algoCurrent && algoCurrent.row === r && algoCurrent.col === c;
      const isPath = path.has(key);
      const isVisited = visited.has(key);
      const isFrontier = frontier.has(key);

      // Determine Styling
      let baseClasses = "w-full h-full rounded-sm transition-all duration-300 border border-slate-800/20 shadow-sm flex items-center justify-center text-xs";
      let bgClass = "bg-white"; // Default empty

      if (isPath) {
        bgClass = "bg-yellow-400 animate-pulse ring-2 ring-yellow-200 z-10";
      } else if (isAlgoCurrent) {
        bgClass = "bg-purple-500 z-20 scale-110 shadow-lg ring-2 ring-purple-300";
      } else if (isPlayer) {
        bgClass = "bg-blue-600 z-20 scale-110 shadow-lg ring-2 ring-blue-300";
      } else if (isStart) {
        bgClass = "bg-emerald-500 z-10";
      } else if (isGoal && revealGoal) {
        bgClass = "bg-red-500 z-10 animate-bounce";
      } else if (isFrontier) {
        bgClass = "bg-indigo-300 animate-pulse";
      } else if (isVisited) {
        // Subtle visual difference for DFS depth if provided
        bgClass = "bg-slate-200";
      }

      // Content
      let content = null;
      if (isPlayer) content = <User size={14} className="text-white" />;
      else if (isAlgoCurrent) content = <Bot size={14} className="text-white" />;
      else if (isStart) content = <div className="text-white font-bold">S</div>;
      else if (isGoal && revealGoal) content = <Flag size={14} className="text-white fill-current" />;

      cells.push(
        <div
          key={key}
          className={`${baseClasses} ${bgClass}`}
          title={`(${r},${c})`}
        >
          {content}
        </div>
      );
    }
  }

  return (
    <div 
      className="grid gap-1 p-1 bg-slate-100 rounded-lg shadow-inner select-none"
      style={{
        gridTemplateColumns: `repeat(${dimensions.cols}, minmax(0, 1fr))`,
        aspectRatio: `${dimensions.cols} / ${dimensions.rows}`
      }}
    >
      {cells}
    </div>
  );
});

export default Grid;