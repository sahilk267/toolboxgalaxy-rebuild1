// Orbital Workbench / Queens bank: seven independently solver-verified region fields. Symmetry-equivalent maps and repeated queen layouts are rejected during authoring.
export type QueensDifficulty = "calm" | "standard" | "dense";
export type QueensEdition = { id: string; difficulty: QueensDifficulty; regions: number[][]; solution: number[]; regionSignature: string; symmetrySignature: string; regionSizes: number[]; searchNodes: number };
const parseRegions = (signature: string) => Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (_, col) => Number(signature[row * 6 + col])));
const edition = (id: string, difficulty: QueensDifficulty, solution: number[], regionSignature: string, symmetrySignature: string, regionSizes: number[], searchNodes: number): QueensEdition => ({ id, difficulty, solution, regions: parseRegions(regionSignature), regionSignature, symmetrySignature, regionSizes, searchNodes });
export const queensEditionBank: QueensEdition[] = [
  edition("queens-apollo", "calm", [1, 4, 0, 3, 5, 2], "001111001111200001203334233334555344", "000011000011011112344412344442334555", [9, 9, 3, 8, 4, 3], 40),
  edition("queens-borealis", "calm", [2, 5, 1, 3, 0, 4], "000001220001223311222333422335444355", "000001220001223311222333422335444355", [8, 4, 9, 8, 4, 3], 80),
  edition("queens-celeste", "standard", [3, 0, 4, 2, 5, 1], "011111021111022333422333422335442555", "000001000021333221333224533224555244", [9, 3, 8, 8, 4, 4], 91),
  edition("queens-drift", "standard", [2, 0, 3, 5, 1, 4], "011112001112001222333244333254333255", "000111000112000222333322445322455333", [8, 5, 8, 3, 9, 3], 125),
  edition("queens-equinox", "standard", [3, 0, 5, 2, 4, 1], "001112011312411352433355433355445555", "000011002221002221302441342445344455", [8, 3, 3, 8, 9, 5], 135),
  edition("queens-fathom", "dense", [4, 0, 3, 1, 5, 2], "001122011112333114333544333554555554", "000001222001222011222331433335443355", [3, 3, 8, 9, 5, 8], 156),
  edition("queens-galileo", "dense", [3, 0, 2, 4, 1, 5], "011123044223004223555223555233555333", "000000001111011112333442333542333555", [3, 4, 3, 8, 9, 9], 185),
];
export function queensEditionForDate(dateId: string) { const [year, month, day] = dateId.split("-").map(Number); const ordinal = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000); return queensEditionBank[((ordinal % queensEditionBank.length) + queensEditionBank.length) % queensEditionBank.length]; }
