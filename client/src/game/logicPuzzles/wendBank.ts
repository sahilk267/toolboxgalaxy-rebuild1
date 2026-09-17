// Orbital Workbench: compact bundled Wend editions; all target-word paths are authored, local, and solver-verified before release.
import type { Cell } from "@/game/logicPuzzles/core";
import type { WendGrid, WendWord } from "@/game/logicPuzzles/wend";

export type WendDifficulty = "calm" | "standard" | "dense";
export type WendEdition = { id: string; difficulty: WendDifficulty; grid: WendGrid; words: WendWord[]; candidatePaths: number; solverNodes: number; wordSignature: string; pathSignature: string };
type WendRecord = { id: string; difficulty: WendDifficulty; grid: string; words: string; candidatePaths: number; solverNodes: number };
const records: WendRecord[] = [
  { id: "wend-apollo", difficulty: "calm", grid: "TKUIZ/AOPPD/NDURI/GUZGS/OSZLE", words: "TANGO:0010203040;SUDOKU:413121110102;PUZZLES:12223242434434;GRID:33232414;ZIP:040313", candidatePaths: 5, solverNodes: 31 },
  { id: "wend-borealis", difficulty: "calm", grid: "TSIGN/IEIFA/BLDEL/RONTR/ODEUO", words: "ORBIT:4030201000;SIGNAL:010203041424;ROUTE:3444433323;FIELD:1312112122;NODE:32314142", candidatePaths: 6, solverNodes: 35 },
  { id: "wend-cascade", difficulty: "standard", grid: "RACEL/TRGLO/EIDAC/LZZUP/SOLVE", words: "SOLVE:4041424344;PUZZLE:343332313020;TRACE:1000010203;LOCAL:0414242313;GRID:12112122", candidatePaths: 6, solverNodes: 33 },
  { id: "wend-delta", difficulty: "standard", grid: "AHCPS/RCTAN/OSUEE/GTDUQ/NAOKU", words: "TANGO:3141403020;SUDOKU:212232424344;QUEENS:343323241404;PATCH:0313120201;ARC:001011", candidatePaths: 7, solverNodes: 33 },
  { id: "wend-equinox", difficulty: "standard", grid: "OMRST/ONATE/ETROM/NPOCT/ALCKE", words: "PLANET:314140302021;ROCKET:223242434434;COMET:3323241404;STAR:03131202;MOON:01001011", candidatePaths: 9, solverNodes: 34 },
  { id: "wend-fathom", difficulty: "dense", grid: "ESTTD/FASEL/VTBUI/EPIRC/RIFYS", words: "VERIFY:203040414243;SCRIPT:443433323121;BUILD:2223241404;TEST:03131202;SAFE:01111000", candidatePaths: 6, solverNodes: 31 },
  { id: "wend-galileo", difficulty: "dense", grid: "LAXOR/AGYWK/HCNEB/TLPOG/OOLAY", words: "GALAXY:111000010212;WORKBENCH:130304142423222120;TOOL:30404131;PLAY:32424344;GO:3433", candidatePaths: 6, solverNodes: 32 },
];
const parseGrid = (encoded: string): WendGrid => encoded.split("/").map((line) => line.split(""));
const parsePath = (encoded: string): Cell[] => Array.from({ length: encoded.length / 2 }, (_, index) => ({ row: Number(encoded[index * 2]), col: Number(encoded[index * 2 + 1]) }));
const parseWords = (encoded: string): WendWord[] => encoded.split(";").map((token) => { const [word, path] = token.split(":"); return { word, path: parsePath(path) }; });
const pathSignature = (words: WendWord[]) => words.map((item) => `${item.word}:${item.path.map((cell) => `${cell.row}${cell.col}`).join("")}`).sort().join("|");

export const wendEditionBank: WendEdition[] = records.map((record) => { const words = parseWords(record.words); return { ...record, grid: parseGrid(record.grid), words, wordSignature: words.map((item) => item.word).sort().join("|"), pathSignature: pathSignature(words) }; });
const dateIndex = (dateId: string) => Array.from(dateId).reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 17) % wendEditionBank.length;
export const wendEditionForDate = (dateId: string) => wendEditionBank[dateIndex(dateId)];
export const wendEditionById = (id: string) => wendEditionBank.find((edition) => edition.id === id);
