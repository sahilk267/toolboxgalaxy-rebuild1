import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Check, RotateCcw, Lightbulb, Dices, Undo2, ShieldCheck } from "lucide-react";
import { generatePractice, isPracticeSolved, type PracticeDifficulty, type PracticeKind, type PracticePuzzle } from "@/game/logicPuzzles/practiceGenerator";
import { sudokuConflicts } from "@/game/logicPuzzles/miniSudoku";
import { queensViolations } from "@/game/logicPuzzles/queens";
import { tangoViolations } from "@/game/logicPuzzles/tango";
type Cell = number | "empty" | "queen" | null;
type Board = Cell[][];
const copyBoard=(grid:Board):Board=>grid.map(row=>[...row]);
function initialBoard(puzzle:PracticePuzzle):Board {
  return puzzle.kind==="queens" ? Array.from({length:6},()=>Array<Cell>(6).fill("empty"))
    : copyBoard(puzzle.givens as Board);
}
function solutionAt(puzzle:PracticePuzzle,row:number,col:number):Cell {
  return puzzle.kind==="queens" ? ((puzzle.solution as number[])[row]===col?"queen":"empty")
    : (puzzle.solution as number[][])[row][col];
}
function progress(puzzle:PracticePuzzle,board:Board):{value:number;total:number} {
  if(puzzle.kind==="queens")return {value:board.flat().filter(x=>x==="queen").length,total:6};
  let total=0,value=0;
  for(let r=0;r<6;r++)for(let c=0;c<6;c++){
    const given=(puzzle.givens as Board)[r][c];
    if(given !== (puzzle.kind==="sudoku"?0:null))continue;
    total++;if(board[r][c]===solutionAt(puzzle,r,c))value++;
  }
  return {value,total};
}
export default function LogicPracticeStudio() {
  const [kind,setKind]=useState<PracticeKind>("sudoku");
  const [difficulty,setDifficulty]=useState<PracticeDifficulty>("standard");
  const [seed,setSeed]=useState("galaxy");
  const [feedback,setFeedback]=useState("Choose a cell, then use the keypad or keyboard.");
  const [hints,setHints]=useState(0);
  const [history,setHistory]=useState<Board[]>([]);
  const generated=useMemo(()=>{
    try{return {puzzle:generatePractice(kind,difficulty,seed)};}
    catch(e){return {error:e instanceof Error?e.message:"Could not generate practice puzzle."};}
  },[kind,difficulty,seed]);
  const puzzle=generated.puzzle;
  const [board,setBoard]=useState<Board>(()=>initialBoard(generatePractice("sudoku","standard","galaxy")));
  const [selected,setSelected]=useState<[number,number]>([0,0]);

  useEffect(()=>{
    if(!puzzle)return;
    setBoard(initialBoard(puzzle));
    setHistory([]);
    setHints(0);
    setSelected([0,0]);
    setFeedback("Practice board generated. Daily streaks are unchanged.");
  },[puzzle]);
  const completed=Boolean(puzzle&&isPracticeSolved(puzzle,board as never));
  const meter=puzzle?progress(puzzle,board):{value:0,total:1};
  const errors=useMemo(()=>{
    if(!puzzle)return new Set<string>();
    if(puzzle.kind==="sudoku")return sudokuConflicts(board as number[][]);
    if(puzzle.kind==="queens")return queensViolations(board as ("queen"|"marked"|"empty")[][],puzzle.regions!);
    return tangoViolations(board as (0|1|null)[][],puzzle.relations!);
  },[puzzle,board]);
  const editable=(r:number,c:number):boolean=>{
    if(!puzzle)return false;
    if(puzzle.kind==="queens")return true;
    return (puzzle.givens as Board)[r][c]===(puzzle.kind==="sudoku"?0:null);
  };
  function setCell(r:number,c:number,next:Cell){
    if(!editable(r,c)||completed)return;
    setHistory(h=>[...h.slice(-49),copyBoard(board)]);
    setBoard(old=>{
      const updated=copyBoard(old);
      if(puzzle?.kind==="queens"&&next==="queen")updated[r]=updated[r].map(()=>"empty");
      updated[r][c]=next;
      return updated;
    });
    setSelected([r,c]);
    setFeedback("Move applied. Use Check to validate the full board.");
  }
  function select(r:number,c:number) {
    if(!editable(r,c)||!puzzle)return;
    if(puzzle.kind==="sudoku"){setSelected([r,c]);return;}
    if(puzzle.kind==="queens"){setCell(r,c,board[r][c]==="queen"?"empty":"queen");return;}
    setCell(r,c,board[r][c]===null?0:board[r][c]===0?1:null);
  }
  function hint(){
    if(!puzzle||completed)return;
    for(let r=0;r<6;r++)for(let c=0;c<6;c++)
      if(editable(r,c)&&board[r][c]!==solutionAt(puzzle,r,c)){
        setCell(r,c,solutionAt(puzzle,r,c));setHints(n=>n+1);
        setFeedback("One verified cell revealed. Hints are noted separately.");
        return;
      }
    setFeedback("All answer cells match the verified solution.");
  }
  function undo(){
    if(!history.length)return;
    setBoard(history[history.length-1]);setHistory(h=>h.slice(0,-1));
    setFeedback("Last move undone.");
  }
  function key(e:KeyboardEvent<HTMLButtonElement>,r:number,c:number){
    let next:[number,number]|null=null;
    if(e.key==="ArrowUp")next=[(r+5)%6,c];
    if(e.key==="ArrowDown")next=[(r+1)%6,c];
    if(e.key==="ArrowLeft")next=[r,(c+5)%6];
    if(e.key==="ArrowRight")next=[r,(c+1)%6];
    if(next){
      e.preventDefault();setSelected(next);
      document.querySelector<HTMLButtonElement>('[data-practice-cell="'+next[0]+':'+next[1]+'"]')?.focus();
      return;
    }
    if(!editable(r,c))return;
    if(puzzle?.kind==="sudoku"&&/^[1-6]$/.test(e.key)){e.preventDefault();setCell(r,c,Number(e.key));}
    if(puzzle?.kind==="tango"&&/^[01]$/.test(e.key)){e.preventDefault();setCell(r,c,Number(e.key));}
    if(puzzle?.kind==="queens"&&e.key.toLowerCase()==="q"){e.preventDefault();select(r,c);}
    if(e.key==="Backspace"||e.key==="Delete"){
      e.preventDefault();setCell(r,c,puzzle?.kind==="queens"?"empty":puzzle?.kind==="sudoku"?0:null);
    }
  }
  function reset(){
    if(!puzzle)return;
    setBoard(initialBoard(puzzle));setHistory([]);setHints(0);setFeedback("Practice restarted.");
  }
  const regenerate=()=>setSeed("p"+Math.random().toString(36).slice(2,10));
  return <section className="my-6 rounded-2xl border border-emerald-400/30 bg-slate-950/60 p-4 sm:p-6" data-game="logic-practice">
    <header className="mb-4">
      <p className="mono-label text-emerald-300">LOGIC LAB / PRACTICE GENERATOR</p>
      <h2 className="font-display text-2xl text-white">Build a fresh puzzle</h2>
      <p className="text-sm text-slate-300">Sudoku, Queens and Tango use rule-preserving variations of independently solver-verified, uniquely solvable editions. Practice does not change daily streaks.</p>
    </header>
    <div className="grid gap-3 sm:grid-cols-4">
      <label className="text-xs text-slate-300">Puzzle
        <select data-practice="kind" className="mt-1 w-full rounded-lg bg-slate-900 p-2" value={kind}
          onChange={e=>setKind(e.target.value as PracticeKind)}>
          <option value="sudoku">Mini Sudoku</option><option value="queens">Queens</option><option value="tango">Tango</option>
        </select>
      </label>
      <label className="text-xs text-slate-300">Difficulty
        <select data-practice="difficulty" className="mt-1 w-full rounded-lg bg-slate-900 p-2" value={difficulty}
          onChange={e=>setDifficulty(e.target.value as PracticeDifficulty)}>
          <option value="calm">Calm</option><option value="standard">Standard</option><option value="dense">Dense</option>
        </select>
      </label>
      <label className="text-xs text-slate-300">Reproducible seed
        <input data-practice="seed" className="mt-1 w-full rounded-lg bg-slate-900 p-2" maxLength={64}
          value={seed} onChange={e=>setSeed(e.target.value)} />
      </label>
      <button type="button" className="signal-button self-end" onClick={regenerate}><Dices size={15}/> New variation</button>
    </div>
    {generated.error&&<p role="alert" className="mt-3 text-sm text-red-300">{generated.error}</p>}
    {puzzle&&<div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <div>
        <div className="grid aspect-square max-w-[400px] grid-cols-6 gap-1 rounded-lg border border-slate-500/40 bg-slate-800 p-2" role="group" aria-label={kind+" practice board"}>
          {board.map((row,r)=>row.map((value,c)=>{
            const given=!editable(r,c),bad=errors.has(r+":"+c),chosen=selected[0]===r&&selected[1]===c;
            const region=puzzle.kind==="queens"?puzzle.regions![r][c]:Math.floor(r/2)*2+Math.floor(c/3);
            const display=kind==="queens"?(value==="queen"?"♛":"·"):
              kind==="tango"?(value===null?"·":value===1?"☀":"☾"):(value||"·");
            return <button key={r+":"+c} data-practice-cell={r+":"+c} type="button"
              aria-label={"Row "+(r+1)+", column "+(c+1)+", "+(value===null||value==="empty"||value===0?"empty":display)}
              aria-pressed={chosen} onClick={()=>select(r,c)} onKeyDown={e=>key(e,r,c)}
              className={"aspect-square rounded text-lg font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300 "+
                (bad?"bg-red-600/50 " : chosen?"bg-lime-400/40 " : given?"bg-slate-600 ":"bg-slate-900 ")+
                "text-white border border-white/10"}
              style={{boxShadow:kind==="queens"?"inset 0 0 0 2px hsl("+((region*63)%360)+",45%,42%)":"none"}}
            >{display}</button>;
          }))}
        </div>
        {kind==="sudoku"&&<div className="mt-2 flex flex-wrap gap-1" aria-label="Mini Sudoku keypad">
          {[1,2,3,4,5,6,0].map(n=><button key={n} type="button" className="logic-action"
            onClick={()=>setCell(selected[0],selected[1],n)}>{n||"Erase"}</button>)}
        </div>}
        {kind==="tango"&&<div className="mt-2 space-y-1">
          <p className="text-xs text-slate-300">Tap cells to cycle empty → moon → sun. Balance 3 of each per row and column; never place 3 matching in a row.</p>
          <p className="text-xs text-amber-200">Relation clues (row, column; 1-based):</p>
          <ul className="max-h-28 overflow-auto text-xs text-slate-300" data-practice="tango-relations">
            {puzzle.relations!.map((link,i)=><li key={i}>
              ({link.a.row+1},{link.a.col+1}) and ({link.b.row+1},{link.b.col+1}): {link.relation==="same"?"equal (=)":"different (×)"}
            </li>)}
          </ul>
        </div>}
        {kind==="queens"&&<p className="mt-2 text-xs text-slate-400">Tap a cell to place/remove a crown. One per row, column and colored region; no touching diagonally.</p>}
      </div>
      <aside className="space-y-3">
        <div className="rounded-xl border border-white/10 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Verified practice field</p>
          <p>Source: <strong>{puzzle.sourceId}</strong></p>
          <p>Correct placements: {meter.value} / {meter.total}</p>
          <p>Hints used: {hints}</p>
          <p>Rule conflicts: {errors.size}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="quiet-button" disabled={!history.length} onClick={undo}><Undo2 size={15}/> Undo</button>
          <button type="button" className="quiet-button" disabled={completed} onClick={hint}><Lightbulb size={15}/> Hint</button>
          <button type="button" className="quiet-button" onClick={reset}><RotateCcw size={15}/> Reset</button>
          <button type="button" className="signal-button" onClick={()=>setFeedback(completed?
            "Solved! Practice board satisfies its full rule validator.":
            "Not solved yet. Fix conflicts and complete every required cell.")}><Check size={15}/> Check</button>
        </div>
        <p role="status" className={completed?"text-emerald-300 text-sm":"text-slate-300 text-sm"}>
          {completed?"Practice solved! ":""}{feedback}
        </p>
        <p className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={14}/> Local-only. Seed + difficulty reproduce the same board. Daily scores are never overwritten.</p>
      </aside>
    </div>}
  </section>;
}
