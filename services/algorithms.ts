import { Coordinate, GridDimensions, AlgoStep, DIRECTIONS } from '../types';
import { PriorityQueue } from './priorityQueue';

const coordToString = (c: Coordinate) => `${c.row},${c.col}`;
const stringToCoord = (s: string): Coordinate => {
  const [row, col] = s.split(',').map(Number);
  return { row, col };
};

const isValid = (c: Coordinate, dims: GridDimensions): boolean => {
  return c.row >= 0 && c.row < dims.rows && c.col >= 0 && c.col < dims.cols;
};

// Reconstruct path from parent map
const reconstructPath = (parentMap: Map<string, string>, end: string): Coordinate[] => {
  const path: Coordinate[] = [];
  let curr: string | undefined = end;
  while (curr) {
    path.unshift(stringToCoord(curr));
    curr = parentMap.get(curr);
  }
  return path;
};

// --- BFS ---
export const runBFS = (dims: GridDimensions, start: Coordinate, goal: Coordinate): AlgoStep[] => {
  const steps: AlgoStep[] = [];
  const startStr = coordToString(start);
  const goalStr = coordToString(goal);
  
  const queue: Coordinate[] = [start];
  const visited = new Set<string>();
  const parentMap = new Map<string, string>();
  const frontier = new Set<string>([startStr]);

  visited.add(startStr);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currStr = coordToString(current);
    frontier.delete(currStr);

    // Snapshot
    steps.push({
      visited: new Set(visited),
      frontier: new Set(frontier),
      current: current
    });

    if (currStr === goalStr) {
      const path = reconstructPath(parentMap, goalStr);
      steps.push({ visited: new Set(visited), frontier: new Set(frontier), path });
      return steps;
    }

    for (const dir of DIRECTIONS) {
      const next: Coordinate = { row: current.row + dir.row, col: current.col + dir.col };
      const nextStr = coordToString(next);

      if (isValid(next, dims) && !visited.has(nextStr)) {
        visited.add(nextStr);
        parentMap.set(nextStr, currStr);
        frontier.add(nextStr);
        queue.push(next);
      }
    }
  }

  return steps;
};

// --- DFS (Recursive) ---
export const runDFSRecursive = (dims: GridDimensions, start: Coordinate, goal: Coordinate): AlgoStep[] => {
  const steps: AlgoStep[] = [];
  const startStr = coordToString(start);
  const goalStr = coordToString(goal);
  
  const visited = new Set<string>();
  const parentMap = new Map<string, string>();
  // We track the recursion stack loosely as "frontier" for viz
  const recursionStack = new Set<string>();
  
  let found = false;

  const dfs = (current: Coordinate, depth: number) => {
    if (found) return;

    const currStr = coordToString(current);
    visited.add(currStr);
    recursionStack.add(currStr);

    steps.push({
      visited: new Set(visited),
      frontier: new Set(recursionStack),
      current: current,
      depth: depth
    });

    if (currStr === goalStr) {
      found = true;
      const path = reconstructPath(parentMap, goalStr);
      steps.push({ visited: new Set(visited), frontier: new Set(recursionStack), path });
      return;
    }

    for (const dir of DIRECTIONS) {
      if (found) return;
      
      const next: Coordinate = { row: current.row + dir.row, col: current.col + dir.col };
      const nextStr = coordToString(next);

      if (isValid(next, dims) && !visited.has(nextStr)) {
        parentMap.set(nextStr, currStr);
        dfs(next, depth + 1);
      }
    }

    // Backtracking visualization
    recursionStack.delete(currStr);
    steps.push({
        visited: new Set(visited),
        frontier: new Set(recursionStack),
        current: current,
        depth: depth - 1
    });
  };

  dfs(start, 0);
  return steps;
};

// --- Dijkstra ---
export const runDijkstra = (dims: GridDimensions, start: Coordinate, goal: Coordinate): AlgoStep[] => {
  const steps: AlgoStep[] = [];
  const startStr = coordToString(start);
  const goalStr = coordToString(goal);

  const pq = new PriorityQueue<string>();
  pq.enqueue(startStr, 0);

  const distances = new Map<string, number>();
  distances.set(startStr, 0);
  
  const parentMap = new Map<string, string>();
  const visited = new Set<string>();
  const frontier = new Set<string>([startStr]);

  while (!pq.isEmpty()) {
    const currStr = pq.dequeue()!;
    const current = stringToCoord(currStr);
    frontier.delete(currStr);
    visited.add(currStr);

    steps.push({
      visited: new Set(visited),
      frontier: new Set(frontier),
      current: current,
      costMap: new Map(distances)
    });

    if (currStr === goalStr) {
      const path = reconstructPath(parentMap, goalStr);
      steps.push({ visited: new Set(visited), frontier: new Set(frontier), path, costMap: new Map(distances) });
      return steps;
    }

    for (const dir of DIRECTIONS) {
      const next: Coordinate = { row: current.row + dir.row, col: current.col + dir.col };
      const nextStr = coordToString(next);

      if (isValid(next, dims)) {
        const newDist = (distances.get(currStr) || 0) + 1; // Unweighted edge = 1
        
        if (newDist < (distances.get(nextStr) ?? Infinity)) {
          distances.set(nextStr, newDist);
          parentMap.set(nextStr, currStr);
          pq.enqueue(nextStr, newDist);
          frontier.add(nextStr);
        }
      }
    }
  }

  return steps;
};

// --- A* ---
export const runAStar = (dims: GridDimensions, start: Coordinate, goal: Coordinate): AlgoStep[] => {
  const steps: AlgoStep[] = [];
  const startStr = coordToString(start);
  const goalStr = coordToString(goal);

  const heuristic = (a: Coordinate, b: Coordinate) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

  const pq = new PriorityQueue<string>();
  pq.enqueue(startStr, 0);

  const gScore = new Map<string, number>(); // Cost from start
  gScore.set(startStr, 0);

  const parentMap = new Map<string, string>();
  const visited = new Set<string>();
  const frontier = new Set<string>([startStr]);

  while (!pq.isEmpty()) {
    const currStr = pq.dequeue()!;
    const current = stringToCoord(currStr);
    
    frontier.delete(currStr);
    visited.add(currStr);

    steps.push({
      visited: new Set(visited),
      frontier: new Set(frontier),
      current: current,
      costMap: new Map(gScore)
    });

    if (currStr === goalStr) {
      const path = reconstructPath(parentMap, goalStr);
      steps.push({ visited: new Set(visited), frontier: new Set(frontier), path, costMap: new Map(gScore) });
      return steps;
    }

    for (const dir of DIRECTIONS) {
      const next: Coordinate = { row: current.row + dir.row, col: current.col + dir.col };
      const nextStr = coordToString(next);

      if (isValid(next, dims)) {
        const tentativeG = (gScore.get(currStr) || 0) + 1;

        if (tentativeG < (gScore.get(nextStr) ?? Infinity)) {
          parentMap.set(nextStr, currStr);
          gScore.set(nextStr, tentativeG);
          const fScore = tentativeG + heuristic(next, goal);
          pq.enqueue(nextStr, fScore);
          frontier.add(nextStr);
        }
      }
    }
  }
  return steps;
};