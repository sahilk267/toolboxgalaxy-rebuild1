export type ChessPiece = 
  | "wK" | "wQ" | "wR" | "wB" | "wN" | "wP"
  | "bK" | "bQ" | "bR" | "bB" | "bN" | "bP"
  | null;

export interface ChessCoord {
  r: number; // 0 = rank 8, 7 = rank 1
  c: number; // 0 = file a, 7 = file h
}

export interface ChessMove {
  from: ChessCoord;
  to: ChessCoord;
  notation: string;
}

export interface ChessPuzzleEdition {
  id: string;
  title: string;
  theme: string;
  turn: "white" | "black";
  difficulty: "Tactics 101" | "Intermediate" | "Master";
  objective: string;
  initialBoard: ChessPiece[][];
  moves: {
    playerMove: ChessMove;
    opponentReply?: ChessMove;
  }[];
  hint: string;
  solutionExplanation: string;
}

export const CHESS_PUZZLE_EDITIONS: ChessPuzzleEdition[] = [
  // Sunday: Back-Rank Mate Deflection
  {
    id: "chess-sunday-backrank",
    title: "The Back-Rank Deflection",
    theme: "Back-Rank Checkmate",
    turn: "white",
    difficulty: "Tactics 101",
    objective: "White to move and deliver unstoppable checkmate.",
    initialBoard: [
      ["bR", null, null, null, null, "bR", "bK", null], // rank 8: a8=R, f8=R, g8=K
      ["bP", "bP", "bP", null, null, "bP", "bP", "bP"], // rank 7: pawns
      [null, null, null, null, null, null, null, null], // rank 6
      [null, null, null, null, null, null, null, null], // rank 5
      [null, null, null, null, null, null, null, null], // rank 4
      [null, null, null, null, null, null, null, null], // rank 3
      ["wP", "wP", "wP", null, null, "wP", "wP", "wP"], // rank 2
      ["wR", null, null, null, null, null, "wK", null], // rank 1: a1=R, g1=K
    ],
    moves: [
      {
        playerMove: { from: { r: 7, c: 0 }, to: { r: 0, c: 0 }, notation: "Ra8#" }
      }
    ],
    hint: "Notice that Black's king on g8 has no escape squares due to pawns on f7, g7, and h7. Look at the a-file rook!",
    solutionExplanation: "1. Ra8# delivers a decisive back-rank checkmate. Black's king cannot flee because of the defensive pawn wall."
  },

  // Monday: The Royal Knight Fork
  {
    id: "chess-monday-fork",
    title: "The Royal Fork",
    theme: "Double Attack (Fork)",
    turn: "white",
    difficulty: "Intermediate",
    objective: "White to move and win decisive material.",
    initialBoard: [
      ["bR", null, "bB", "bQ", "bK", null, null, "bR"], // rank 8: c8=B, d8=Q, e8=K
      ["bP", "bP", null, null, null, "bP", "bP", "bP"], // rank 7
      [null, null, null, null, null, null, null, null], // rank 6
      [null, null, null, "wN", null, null, null, null], // rank 5: d5=N
      [null, null, null, null, null, null, null, null], // rank 4
      [null, null, null, null, null, null, null, null], // rank 3
      ["wP", "wP", "wP", null, null, "wP", "wP", "wP"], // rank 2
      ["wR", null, null, null, "wK", null, null, "wR"], // rank 1
    ],
    moves: [
      {
        playerMove: { from: { r: 3, c: 3 }, to: { r: 1, c: 2 }, notation: "Nc7+" },
        opponentReply: { from: { r: 0, c: 4 }, to: { r: 0, c: 3 }, notation: "Kd8" }
      },
      {
        playerMove: { from: { r: 1, c: 2 }, to: { r: 0, c: 0 }, notation: "Nxa8" }
      }
    ],
    hint: "The knight on d5 can jump to a square checking the king while threatening the unprotected rook on a8.",
    solutionExplanation: "1. Nc7+ forks the king on e8 and the rook on a8, winning a clean rook."
  },

  // Tuesday: Smothered Mate Pattern
  {
    id: "chess-tuesday-smothered",
    title: "The Smothered Stunner",
    theme: "Philidor's Legacy / Smothered Mate",
    turn: "white",
    difficulty: "Master",
    objective: "White to move and execute a legendary checkmate sequence.",
    initialBoard: [
      [null, null, null, null, null, "bR", null, "bK"], // rank 8: f8=R, h8=K
      [null, null, null, null, null, "bP", "bP", "bP"], // rank 7: f7, g7, h7 pawns
      [null, null, null, null, null, "wN", null, null], // rank 6: f6=N
      [null, null, null, null, null, null, null, null], // rank 5
      [null, null, null, null, null, null, null, null], // rank 4
      [null, null, null, null, null, null, null, null], // rank 3
      ["wP", "wP", "wP", null, null, "wP", "wP", "wP"], // rank 2
      [null, null, null, null, null, null, "wK", null], // rank 1
    ],
    moves: [
      {
        playerMove: { from: { r: 2, c: 5 }, to: { r: 1, c: 6 }, notation: "Nf7#" }
      }
    ],
    hint: "Black's king is completely surrounded by own pieces. A single knight check cannot be blocked.",
    solutionExplanation: "1. Nf7# is a pure smothered checkmate. The king is choked by friendly pawns on g7/h7 and rook on f8."
  },

  // Wednesday: Anastasia's Corridor Mate
  {
    id: "chess-wednesday-anastasia",
    title: "Anastasia's Corridor",
    theme: "Knight & Rook Geometry",
    turn: "white",
    difficulty: "Intermediate",
    objective: "White to move and finish off the cornered monarch.",
    initialBoard: [
      [null, null, null, null, null, null, null, "bK"], // rank 8: h8=K
      [null, null, null, null, null, null, "bP", null], // rank 7: g7=P
      [null, null, null, null, "wN", null, null, null], // rank 6: e6=N
      [null, null, null, null, null, null, null, null], // rank 5
      [null, null, null, null, null, null, null, null], // rank 4
      [null, null, null, null, null, null, null, null], // rank 3
      ["wP", "wP", "wP", null, null, "wP", "wP", "wP"], // rank 2
      [null, null, null, "wR", null, null, "wK", null], // rank 1: d1=R, g1=K
    ],
    moves: [
      {
        playerMove: { from: { r: 7, c: 3 }, to: { r: 7, c: 7 }, notation: "Rh1#" }
      }
    ],
    hint: "The knight on e6 controls the escape square g7 and blocks g8. Swing the rook to the open h-file!",
    solutionExplanation: "1. Rh1# attacks down the open h-file while the knight on e6 guards the g7 flight square."
  },

  // Thursday: Boden's Criss-Cross Mate
  {
    id: "chess-thursday-boden",
    title: "Boden's Diagonal Net",
    theme: "Criss-Crossing Bishops",
    turn: "white",
    difficulty: "Master",
    objective: "White to move and exploit the Queenside king.",
    initialBoard: [
      [null, null, "bK", "bR", null, null, null, null], // rank 8: c8=K, d8=R
      ["bP", "bP", "bN", null, null, null, null, null], // rank 7: a7=P, b7=P, c7=N
      [null, null, null, null, null, null, null, null], // rank 6
      ["wB", null, null, null, null, null, null, null], // rank 5: a5=B
      [null, null, null, "wB", null, null, null, null], // rank 4: d4=B
      [null, null, null, null, null, null, null, null], // rank 3
      ["wP", "wP", "wP", null, null, "wP", "wP", "wP"], // rank 2
      [null, null, null, null, "wK", null, null, null], // rank 1
    ],
    moves: [
      {
        playerMove: { from: { r: 3, c: 0 }, to: { r: 2, c: 2 }, notation: "Ba6#" }
      }
    ],
    hint: "Look at the light-squared bishop on a5. The dark-squared bishop on d4 is already slicing the d8-b6 diagonal.",
    solutionExplanation: "1. Ba6# delivers Boden's mate. Two intersecting bishop diagonals leave the king with nowhere to run."
  },

  // Friday: Queen & Knight Arabian Battery
  {
    id: "chess-friday-battery",
    title: "The Scholar's Echo",
    theme: "Queen Infiltration",
    turn: "white",
    difficulty: "Tactics 101",
    objective: "White to move and land the fatal blow on f7.",
    initialBoard: [
      ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"], // rank 8
      ["bP", "bP", "bP", "bP", null, "bP", "bP", "bP"], // rank 7: f7 is weak
      [null, null, null, null, null, null, null, null], // rank 6
      [null, null, "wB", null, null, null, null, null], // rank 5: c4=B (c=2, r=4)
      [null, null, null, null, null, null, null, null], // rank 4
      [null, null, null, null, null, null, null, null], // rank 3
      ["wP", "wP", "wP", "wP", null, "wP", "wP", "wP"], // rank 2
      ["wR", "wN", "wB", null, "wK", null, null, "wR"], // rank 1: wQ on h5 (c=7, r=4)
    ],
    moves: [
      {
        playerMove: { from: { r: 4, c: 7 }, to: { r: 1, c: 5 }, notation: "Qxf7#" }
      }
    ],
    hint: "Notice the bishop on c4 targeting f7, and the queen on h5 also eyeing that identical square.",
    solutionExplanation: "1. Qxf7# executes the classic checkmate battery against Black's uncastled king."
  },

  // Saturday: Queen Sac to Opera Mate
  {
    id: "chess-saturday-opera",
    title: "Morphy's Opera Theme",
    theme: "Rook & Bishop Harmony",
    turn: "white",
    difficulty: "Intermediate",
    objective: "White to move and finish the game Paul Morphy style.",
    initialBoard: [
      [null, null, null, "bK", null, null, null, "bR"], // rank 8: d8=K, h8=R
      ["bP", "bP", null, null, null, "bP", "bP", "bP"], // rank 7
      [null, null, null, null, null, null, null, null], // rank 6
      [null, null, null, null, "wB", null, null, null], // rank 5: e5=B (r=3, c=4)
      [null, null, null, null, null, null, null, null], // rank 4
      [null, null, null, null, null, null, null, null], // rank 3
      ["wP", "wP", "wP", null, null, "wP", "wP", "wP"], // rank 2
      [null, null, null, "wR", null, null, "wK", null], // rank 1: d1=R (r=7, c=3)
    ],
    moves: [
      {
        playerMove: { from: { r: 7, c: 3 }, to: { r: 0, c: 3 }, notation: "Rd8#" }
      }
    ],
    hint: "The bishop on e5 cuts off c7, d6, and e7. Deliver the rook check on the 8th rank!",
    solutionExplanation: "1. Rd8# pins the king against the back rank with the bishop guarding the flight squares."
  }
];

// Fix White Queen setup for Friday puzzle
CHESS_PUZZLE_EDITIONS[5].initialBoard[4][7] = "wQ"; // h5

export function getChessEditionForDate(dateStr?: string): ChessPuzzleEdition {
  if (!dateStr) {
    const d = new Date();
    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CHESS_PUZZLE_EDITIONS.length;
  return CHESS_PUZZLE_EDITIONS[index];
}
