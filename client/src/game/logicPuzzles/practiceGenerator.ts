/**
 * Logic Lab practice variants. They transform independently solver-verified authored
 * editions using rule-preserving symmetries instead of manufacturing unverified grids.
 * Generated variants are deterministic for a given kind/difficulty/seed.
 */
import { miniSudokuEditionBank, countSudokuSolutions, solvedSudoku, type SudokuGrid } from "./miniSudoku";
import { queensEditionBank, countQueensSolutionsFor, solvedQueens, type QueenState } from "./queens";
import { tangoEditionBank } from "./tangoBank";
import { countTangoSolutions, solvedTango, type TangoGrid, type TangoRelation } from "./tango";
export type PracticeDifficulty = "calm" | "standard" | "dense";
export type PracticeKind = "sudoku" | "queens" | "tango";
export type PracticePuzzle = {
  kind: PracticeKind;
  difficulty: PracticeDifficulty;
  seed: string;
  sourceId: string;
  solution: SudokuGrid | number[] | TangoGrid;
  givens?: SudokuGrid | TangoGrid;
  regions?: number[][];
  relations?: TangoRelation[];
};

export function practiceSeedError(seed: string): string | null {
  if (seed.trim().length < 1 || seed.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(seed))
    return "Choose a 1–64 character seed using letters, numbers, - or _.";
  return null;
}
export function practiceRng(value: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < value.length; i++) {
    state ^= value.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  if (!state) state = 0x9e3779b9;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = Array.from(items);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i],result[j]] = [result[j],result[i]];
  }
  return result;
}
function sudokuVariant(seed: string, difficulty: PracticeDifficulty, rng: () => number): PracticePuzzle {
  const entries = miniSudokuEditionBank.filter(e => e.difficulty === difficulty);
  const selected = entries[Math.floor(rng()*entries.length)];
  // The size-6 boxes are 2 rows × 3 columns. Only shuffle within box bands,
  // and shuffle whole bands/stacks. Transpose would break 2x3 box semantics.
  const rows = shuffle([0,1,2],rng).flatMap(band =>
    shuffle([0,1],rng).map(row => band*2+row));
  const cols = shuffle([0,1],rng).flatMap(stack =>
    shuffle([0,1,2],rng).map(col => stack*3+col));
  const digitMap = [0,...shuffle([1,2,3,4,5,6],rng)];
  const move = (grid: SudokuGrid): SudokuGrid =>
    rows.map(row => cols.map(col => digitMap[grid[row][col]]));
  return {
    kind:"sudoku",difficulty,seed,sourceId:selected.id,
    givens:move(selected.givens),
    solution:move(selected.solution),
  };
}
const SIZE = 6;
function position(row:number,col:number,quarterTurns:number,mirror:boolean):[number,number] {
  if (mirror) col=SIZE-1-col;
  for (let i=0;i<quarterTurns;i++) [row,col]=[col,SIZE-1-row];
  return [row,col];
}
function queensVariant(seed:string,difficulty:PracticeDifficulty,rng:()=>number):PracticePuzzle {
  const entries=queensEditionBank.filter(e=>e.difficulty===difficulty);
  const selected=entries[Math.floor(rng()*entries.length)];
  const turn=Math.floor(rng()*4),mirror=rng()>0.5;
  const regions=Array.from({length:SIZE},()=>Array<number>(SIZE).fill(0));
  const solution=Array<number>(SIZE).fill(-1);
  for(let row=0;row<SIZE;row++)for(let col=0;col<SIZE;col++){
    const [r,c]=position(row,col,turn,mirror);
    regions[r][c]=selected.regions[row][col];
    if(selected.solution[row]===col)solution[r]=c;
  }
  return {kind:"queens",difficulty,seed,sourceId:selected.id,regions,solution};
}
function tangoVariant(seed:string,difficulty:PracticeDifficulty,rng:()=>number):PracticePuzzle {
  const entries=tangoEditionBank.filter(e=>e.difficulty===difficulty);
  const selected=entries[Math.floor(rng()*entries.length)];
  const turn=Math.floor(rng()*4),mirror=rng()>0.5,flip=rng()>0.5;
  const givens=Array.from({length:SIZE},()=>Array<0|1|null>(SIZE).fill(null));
  const solution=Array.from({length:SIZE},()=>Array<0|1|null>(SIZE).fill(null));
  const transformed=(x:0|1|null) => x===null?null:flip?(1-x) as 0|1:x;
  for(let row=0;row<SIZE;row++)for(let col=0;col<SIZE;col++){
    const [r,c]=position(row,col,turn,mirror);
    givens[r][c]=transformed(selected.givens[row][col]);
    solution[r][c]=transformed(selected.solution[row][col]);
  }
  const relations:TangoRelation[]=selected.relations.map(({a,b,relation})=>{
    const [ar,ac]=position(a.row,a.col,turn,mirror),[br,bc]=position(b.row,b.col,turn,mirror);
    return {a:{row:ar,col:ac},b:{row:br,col:bc},relation};
  });
  return {kind:"tango",difficulty,seed,sourceId:selected.id,givens,solution,relations};
}
export function generatePractice(kind:PracticeKind,difficulty:PracticeDifficulty,seed:string):PracticePuzzle {
  const error=practiceSeedError(seed);
  if(error)throw new Error(error);
  if(!["calm","standard","dense"].includes(difficulty))throw new Error("Unknown difficulty.");
  const rng=practiceRng(kind+":"+difficulty+":"+seed);
  if(kind==="sudoku")return sudokuVariant(seed,difficulty,rng);
  if(kind==="queens")return queensVariant(seed,difficulty,rng);
  if(kind==="tango")return tangoVariant(seed,difficulty,rng);
  throw new Error("Unsupported practice type.");
}
export function countPracticeSolutions(puzzle:PracticePuzzle):number {
  if(puzzle.kind==="sudoku")return countSudokuSolutions(puzzle.givens as SudokuGrid,2);
  if(puzzle.kind==="queens")return countQueensSolutionsFor(puzzle.regions!,2);
  return countTangoSolutions(puzzle.givens as TangoGrid,2,puzzle.relations!);
}
export function isPracticeSolved(puzzle:PracticePuzzle, board:number[][] | QueenState[][] | TangoGrid):boolean {
  if(puzzle.kind==="sudoku")return solvedSudoku(board as SudokuGrid);
  if(puzzle.kind==="queens")return solvedQueens(board as QueenState[][],puzzle.regions);
  return solvedTango(board as TangoGrid,puzzle.relations);
}
