import { advanceGameClock } from "../client/src/game/visibleGameTimer";
/** Actual generated practice puzzles must retain uniqueness after every symmetry. */
import {
  generatePractice, countPracticeSolutions, practiceSeedError,
  isPracticeSolved, type PracticeKind, type PracticeDifficulty,
} from "../client/src/game/logicPuzzles/practiceGenerator";
import { solvedSudoku, countSudokuSolutions, type SudokuGrid } from "../client/src/game/logicPuzzles/miniSudoku";
import { solvedQueens, countQueensSolutionsFor, type QueenState } from "../client/src/game/logicPuzzles/queens";
import { solvedTango, countTangoSolutions, type TangoGrid } from "../client/src/game/logicPuzzles/tango";

let count=0;
const clockStart = {lastTick:1000,remainderMs:0};
const tickA = advanceGameClock(clockStart,1750,true);
const tickB = advanceGameClock(tickA.state,2250,true);
const hidden = advanceGameClock(tickB.state,12_250,false);
const resumed = advanceGameClock(hidden.state,12_750,true);
const invalidTime = advanceGameClock(resumed.state,10,true);

function check(actual:unknown, name:string) {
  if(!actual)throw new Error("Games practice regression: "+name);
  count++;
}
function eq(actual:unknown,expected:unknown,name:string) {
  check(actual===expected,name+" ("+JSON.stringify(actual)+" vs "+JSON.stringify(expected)+")");
}
eq(tickA.seconds,0,"subsecond active time accumulated");
eq(tickB.seconds,1,"active elapsed seconds increment correctly");
eq(hidden.seconds,0,"hidden tab does not accrue 10 seconds");
eq(resumed.seconds,0,"first 500ms after tab restore does not fast-forward");
eq(invalidTime.seconds,0,"clock rollback does not create negative time");
check(Number.isFinite(invalidTime.state.lastTick),"clock remains finite after rollback");
for(const value of ["","  ","invalid seed","a".repeat(65),"x!","💡"]){
  check(Boolean(practiceSeedError(value)),"seed rejects invalid string "+JSON.stringify(value).slice(0,15));
}
eq(practiceSeedError("galaxy"),null,"default seed accepted");
eq(practiceSeedError("a_B-9"),null,"shareable seed alphabet accepted");
let generatedCount=0;
for(const kind of ["sudoku","queens","tango"] as PracticeKind[]){
  for(const difficulty of ["calm","standard","dense"] as PracticeDifficulty[]){
    const signatures=new Set<string>();
    for(let index=0;index<8;index++){
      const seed="practice"+index;
      const board=generatePractice(kind,difficulty,seed);
      generatedCount++;
      eq(board.kind,kind,"practice kind retained");
      eq(board.difficulty,difficulty,"difficulty retained");
      eq(board.seed,seed,"seed retained");
      check(Boolean(board.sourceId),"source edition recorded");
      eq(countPracticeSolutions(board),1,"generated board is uniquely solvable");
      const copy=generatePractice(kind,difficulty,seed);
      eq(JSON.stringify(board),JSON.stringify(copy),"generation deterministic for seed");
      if(kind==="sudoku"){
        const solution=board.solution as SudokuGrid, givens=board.givens as SudokuGrid;
        check(solvedSudoku(solution),"transformed sudoku solution satisfies 2x3 boxes");
        eq(countSudokuSolutions(givens,2),1,"sudoku givens uniquely solvable");
        check(givens.flat().filter(Boolean).length>0,"sudoku clues present");
        for(let r=0;r<6;r++)for(let c=0;c<6;c++)
          if(givens[r][c])eq(givens[r][c],solution[r][c],"sudoku clue matches solution");
        check(isPracticeSolved(board,solution),"practice Sudoku validator accepts solved grid");
        const empty=givens.map(row=>[...row]);
        check(!isPracticeSolved(board,empty),"practice Sudoku validator rejects incomplete givens");
        signatures.add(givens.flat().join(""));
      } else if(kind==="queens") {
        const regions=board.regions!,cols=board.solution as number[];
        const placement:QueenState[][]=Array.from({length:6},(_,r)=>
          Array.from({length:6},(_,c)=>cols[r]===c?"queen":"empty"));
        eq(new Set(cols).size,6,"queen solution uses unique columns");
        eq(countQueensSolutionsFor(regions,2),1,"queen region map uniquely solvable");
        check(solvedQueens(placement,regions),"transformed queen placement satisfies row/col/region/touching");
        check(isPracticeSolved(board,placement),"practice Queen validator accepts solution");
        check(!isPracticeSolved(board,placement.map(row=>row.map(()=>"empty"))),"empty queens not solved");
        signatures.add(regions.flat().join(""));
      } else {
        const givens=board.givens as TangoGrid,solution=board.solution as TangoGrid,links=board.relations!;
        eq(countTangoSolutions(givens,2,links),1,"Tango givens have one solution");
        check(solvedTango(solution,links),"transformed Tango board respects relation constraints");
        check(isPracticeSolved(board,solution),"Tango validator accepts completed board");
        check(!isPracticeSolved(board,givens),"Tango givens alone cannot win");
        for(const item of links){
          const distance=Math.abs(item.a.row-item.b.row)+Math.abs(item.a.col-item.b.col);
          eq(distance,1,"Tango relation stays adjacent after symmetry");
          check(item.a.row>=0&&item.a.row<6&&item.b.col<6,"Tango transformed coordinates in bounds");
        }
        for(let r=0;r<6;r++)for(let c=0;c<6;c++)
          if(givens[r][c]!==null)eq(givens[r][c],solution[r][c],"Tango fixed clues preserved");
        signatures.add(givens.flat().map(v=>v===null?"-":v).join(""));
      }
    }
    check(signatures.size>=2,"eight seeds generate more than one real board for "+kind+"/"+difficulty);
  }
}
for(const kind of ["nope",null,1] as unknown as PracticeKind[]){
  try{generatePractice(kind,"standard","a");check(false,"invalid kind must reject");}
  catch(error){if(error instanceof Error&&error.message.startsWith("Games practice regression:"))throw error;count++;}
}
console.log("PASS: "+count+" game-practice solver assertions across "+generatedCount+" uniquely solvable generated fields.");
