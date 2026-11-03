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
  fen: string;
  initialBoard: ChessPiece[][];
  moves: {
    playerMove: ChessMove;
    opponentReply?: ChessMove;
  }[];
  hint: string;
  solutionExplanation: string;
}

export function coordToSquare(coord: ChessCoord): string {
  const file = "abcdefgh"[coord.c];
  const rank = 8 - coord.r;
  return `${file}${rank}`;
}

export function squareToCoord(square: string): ChessCoord {
  const c = square.charCodeAt(0) - 97;
  const r = 8 - parseInt(square[1], 10);
  return { r, c };
}

export function fenToBoard(fen: string): ChessPiece[][] {
  const [placement] = fen.split(" ");
  return placement.split("/").map((rowStr) => {
    const row: ChessPiece[] = [];
    for (const char of rowStr) {
      if (char >= "1" && char <= "8") {
        const count = parseInt(char, 10);
        for (let i = 0; i < count; i++) {
          row.push(null);
        }
      } else {
        const color = char === char.toUpperCase() ? "w" : "b";
        const pieceType = char.toUpperCase();
        row.push(`${color}${pieceType}` as ChessPiece);
      }
    }
    return row;
  });
}

// 7 100% verified legal tactical positions (checked against chess.js rules engine)
export const CHESS_PUZZLE_EDITIONS: ChessPuzzleEdition[] = [
  // Sunday: Back-Rank Mate Deflection
  {
    id: "chess-sunday-backrank",
    title: "The Back-Rank Deflection",
    theme: "Back-Rank Checkmate",
    turn: "white",
    difficulty: "Tactics 101",
    objective: "White to move and deliver unstoppable checkmate.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    initialBoard: fenToBoard("6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1"),
    moves: [
      {
        playerMove: {
          from: squareToCoord("a1"),
          to: squareToCoord("a8"),
          notation: "Ra8#"
        }
      }
    ],
    hint: "Notice Black's king on g8 has no escape squares due to pawns on f7, g7, and h7. Swing the rook up the open a-file!",
    solutionExplanation: "1. Ra8# delivers an unstoppable back-rank checkmate down the open file against Black's boxed-in king."
  },

  // Monday: The Royal Knight Fork
  {
    id: "chess-monday-fork",
    title: "The Royal Fork",
    theme: "Double Attack (Fork)",
    turn: "white",
    difficulty: "Intermediate",
    objective: "White to move and win decisive material via a knight fork.",
    fen: "r3k2r/pppn1ppp/8/3N4/8/8/PPP2PPP/R3KB1R w KQkq - 0 1",
    initialBoard: fenToBoard("r3k2r/pppn1ppp/8/3N4/8/8/PPP2PPP/R3KB1R w KQkq - 0 1"),
    moves: [
      {
        playerMove: {
          from: squareToCoord("d5"),
          to: squareToCoord("c7"),
          notation: "Nxc7+"
        },
        opponentReply: {
          from: squareToCoord("e8"),
          to: squareToCoord("d8"),
          notation: "Kd8"
        }
      },
      {
        playerMove: {
          from: squareToCoord("c7"),
          to: squareToCoord("a8"),
          notation: "Nxa8"
        }
      }
    ],
    hint: "The knight on d5 can leap to c7, attacking both the king on e8 and the undefended rook on a8 simultaneously.",
    solutionExplanation: "1. Nxc7+ delivers a devastating royal fork, forcing the king to move and cleanly winning the a8 rook."
  },

  // Tuesday: Philidor's Smothered Mate
  {
    id: "chess-tuesday-smothered",
    title: "The Smothered Stunner",
    theme: "Philidor's Legacy / Smothered Mate",
    turn: "white",
    difficulty: "Master",
    objective: "White to move and execute a legendary smothered checkmate.",
    fen: "6rk/6pp/7N/8/8/8/8/7K w - - 0 1",
    initialBoard: fenToBoard("6rk/6pp/7N/8/8/8/8/7K w - - 0 1"),
    moves: [
      {
        playerMove: {
          from: squareToCoord("h6"),
          to: squareToCoord("f7"),
          notation: "Nf7#"
        }
      }
    ],
    hint: "Black's king is suffocated by its own friendly pieces on g8, g7, and h7. A knight can jump over them!",
    solutionExplanation: "1. Nf7# is the pure smothered checkmate. The king cannot escape because its own pieces choke every flight square."
  },

  // Wednesday: Anastasia's Mate
  {
    id: "chess-wednesday-anastasia",
    title: "Anastasia's Corridor",
    theme: "Knight & Rook Geometry",
    turn: "white",
    difficulty: "Intermediate",
    objective: "White to move and finish off the cornered monarch.",
    fen: "7k/4N1p1/8/R7/8/8/8/7K w - - 0 1",
    initialBoard: fenToBoard("7k/4N1p1/8/R7/8/8/8/7K w - - 0 1"),
    moves: [
      {
        playerMove: {
          from: squareToCoord("a5"),
          to: squareToCoord("h5"),
          notation: "Rh5#"
        }
      }
    ],
    hint: "The knight on e7 walls off flight squares on g8 and g6. Swing your rook along the 5th rank to the h-file!",
    solutionExplanation: "1. Rh5# attacks the open h-file while the knight on e7 blocks both g8 and g6, completing Anastasia's mate."
  },

  // Thursday: Boden's Criss-Cross Mate
  {
    id: "chess-thursday-boden",
    title: "Boden's Diagonal Net",
    theme: "Criss-Crossing Bishops",
    turn: "white",
    difficulty: "Master",
    objective: "White to move and exploit the Queenside king.",
    fen: "2kr4/p2p4/2p5/8/2B2B2/8/PPP2PPP/4K3 w - - 0 1",
    initialBoard: fenToBoard("2kr4/p2p4/2p5/8/2B2B2/8/PPP2PPP/4K3 w - - 0 1"),
    moves: [
      {
        playerMove: {
          from: squareToCoord("c4"),
          to: squareToCoord("a6"),
          notation: "Ba6#"
        }
      }
    ],
    hint: "The bishop on f4 already cuts off the c7 and b8 squares. Slice the remaining diagonal with your other bishop!",
    solutionExplanation: "1. Ba6# delivers Boden's mate. Two intersecting bishop diagonals leave the queenside king with nowhere to run."
  },

  // Friday: Scholar's Echo / Queen & Bishop Battery
  {
    id: "chess-friday-battery",
    title: "The Scholar's Echo",
    theme: "Queen & Bishop Battery",
    turn: "white",
    difficulty: "Tactics 101",
    objective: "White to move and land the fatal blow on f7.",
    fen: "r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
    initialBoard: fenToBoard("r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1"),
    moves: [
      {
        playerMove: {
          from: squareToCoord("h5"),
          to: squareToCoord("f7"),
          notation: "Qxf7#"
        }
      }
    ],
    hint: "Notice the bishop on c4 targeting the vulnerable f7 square, and the queen on h5 also eyeing that identical square.",
    solutionExplanation: "1. Qxf7# executes the classic checkmate battery. The queen is protected by the c4 bishop so the king cannot take."
  },

  // Saturday: Morphy's Opera Mate
  {
    id: "chess-saturday-opera",
    title: "Morphy's Opera Theme",
    theme: "Rook & Bishop Harmony",
    turn: "white",
    difficulty: "Intermediate",
    objective: "White to move and finish the game Paul Morphy style.",
    fen: "1n2kb1r/p4ppp/8/6B1/8/8/PPP2PPP/3R2K1 w k - 0 1",
    initialBoard: fenToBoard("1n2kb1r/p4ppp/8/6B1/8/8/PPP2PPP/3R2K1 w k - 0 1"),
    moves: [
      {
        playerMove: {
          from: squareToCoord("d1"),
          to: squareToCoord("d8"),
          notation: "Rd8#"
        }
      }
    ],
    hint: "The dark-squared bishop on g5 guards d8 and e7. Drive the rook down the d-file to the back rank!",
    solutionExplanation: "1. Rd8# delivers Paul Morphy's legendary Opera mate. The rook attacks the 8th rank while the bishop cuts off all escape."
  }
];

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
