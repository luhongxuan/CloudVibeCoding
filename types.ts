export type AlgorithmType = 'BFS' | 'DFS' | 'Dijkstra' | 'A*';

export type Coordinate = {
  row: number;
  col: number;
};

export type GridDimensions = {
  rows: number;
  cols: number;
};

// State of a cell during algorithm execution
export enum CellState {
  EMPTY = 'EMPTY',
  START = 'START',
  GOAL = 'GOAL',
  VISITED = 'VISITED', // Processed
  FRONTIER = 'FRONTIER', // In queue/stack
  PATH = 'PATH', // Final path
  CURRENT = 'CURRENT' // Currently being inspected
}

// A snapshot of the algorithm's memory at a specific step
export interface AlgoStep {
  visited: Set<string>; // Set of "row,col" strings
  frontier: Set<string>; // Set of "row,col" strings
  current?: Coordinate;
  path?: Coordinate[];
  depth?: number; // For DFS visualization
  costMap?: Map<string, number>; // For Dijkstra/A* visualization
}

export interface GameResult {
  winner: 'PLAYER' | 'ALGORITHM' | 'DRAW';
  playerSteps: number;
  playerTime: number;
  algoSteps: number; // Path length
  algoVisitedCount: number;
  algoTime: number; // Simulated ticks
}

export const DIRECTIONS = [
  { row: -1, col: 0 }, // Up
  { row: 1, col: 0 },  // Down
  { row: 0, col: -1 }, // Left
  { row: 0, col: 1 },  // Right
];