import { getPieceValue } from "./function.js";
import { PIECE_SQUARE_TABLES } from "./constants.js";

// ------------------ Cải tiến hàm evaluateBoard ------------------ //
function evaluateBoard(game) {
  let evaluation = 0;
  const phase = getGamePhase(game);
  const boardRows = game.fen().split(" ")[0].split("/");

  boardRows.forEach((row, y) => {
    let x = 0;
    for (let char of row) {
      if (!isNaN(char)) {
        x += parseInt(char);
      } else {
        let squareName = String.fromCharCode(97 + x) + (8 - y);
        let piece = game.get(squareName);

        if (piece) {
          const pieceValue = getPieceValue(piece.type);
          const sign = piece.color === "w" ? 1 : -1;
          let positionValue = 0;

          if (PIECE_SQUARE_TABLES[piece.type.toUpperCase()]) {
            const table = PIECE_SQUARE_TABLES[piece.type.toUpperCase()];
            const tableRow = piece.color === "w" ? 7 - y : y;
            positionValue = table[tableRow][x] || 0;
          }

          evaluation +=
            sign * (pieceValue + positionValue * (phase === 2 ? 0.5 : 1));
        }
        x++;
      }
    }
  });

  // Thêm các yếu tố phụ
  evaluation +=
    evaluateCenterControl(game, "w") - evaluateCenterControl(game, "b");
  evaluation += evaluateKingSafety(game, "w") - evaluateKingSafety(game, "b");
  evaluation +=
    evaluatePawnStructure(game, "w") - evaluatePawnStructure(game, "b");

  return evaluation;
}

// ------------------ Các hàm hỗ trợ mới ------------------ //

// Xác định giai đoạn game (0 = khai cuộc, 1 = trung cuộc, 2 = tàn cuộc)
function getGamePhase(game) {
  const pieceCount = game
    .fen()
    .split(" ")[0]
    .replace(/[^a-z]/gi, "").length;
  if (pieceCount > 24) return 0;
  if (pieceCount > 12) return 1;
  return 2;
}

// Tính điểm kiểm soát trung tâm
function evaluateCenterControl(game, color) {
  const centerSquares = ["d4", "e4", "d5", "e5"];
  let control = 0;
  centerSquares.forEach((sq) => {
    const piece = game.get(sq);
    if (piece && piece.color === color) control += 1;
  });
  return control * 3;
}

// Đánh giá an toàn của Vua
function evaluateKingSafety(game, color) {
  const kingSymbol = color === "w" ? "K" : "k";
  const fen = game.fen().split(" ")[0];

  let kingSquare = null;
  let col = 0,
    row = 0;

  for (const char of fen) {
    if (char === "/") {
      row++;
      col = 0;
    } else if (!isNaN(char)) {
      col += parseInt(char);
    } else {
      if (char === kingSymbol) {
        kingSquare = { row, col };
        break;
      }
      col++;
    }
  }

  if (!kingSquare) return 0;

  // Đếm số quân bảo vệ xung quanh Vua
  let safety = 0;
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  directions.forEach(([dx, dy]) => {
    let x = kingSquare.col + dx;
    let y = kingSquare.row + dy;
    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      let squareName = String.fromCharCode(97 + x) + (8 - y);
      let piece = game.get(squareName);
      if (piece && piece.color === color) safety += 1;
    }
  });

  return safety * 2;
}

// Đánh giá cấu trúc Tốt
function evaluatePawnStructure(game, color) {
  let score = 0;
  let pawns = [];
  const boardRows = game.fen().split(" ")[0].split("/");

  boardRows.forEach((row, y) => {
    let x = 0;
    for (let char of row) {
      if (!isNaN(char)) {
        x += parseInt(char);
      } else {
        if (char === (color === "w" ? "P" : "p")) {
          pawns.push({ x, y });
        }
        x++;
      }
    }
  });

  // Kiểm tra tốt cô lập và liền nhau
  pawns.forEach((pawn) => {
    const hasAdjacent = pawns.some(
      (p) => Math.abs(p.x - pawn.x) === 1 && p.y === pawn.y
    );
    if (!hasAdjacent) score -= 1; // Tốt cô lập
  });

  return score;
}

// ------------------ Cải tiến minimax với move ordering ------------------ //
export function minimax(game, depth, isMaximizingPlayer, alpha, beta) {
  if (depth === 0 || game.game_over()) {
    return { move: null, evaluation: evaluateBoard(game) };
  }

  const moves = game.moves({ verbose: true });

  // Sắp xếp nước đi theo heuristic
  moves.sort((a, b) => {
    // Ưu tiên ăn quân có giá trị cao
    const captureDiff =
      (getPieceValue(b.captured) || 0) - (getPieceValue(a.captured) || 0);
    if (captureDiff !== 0) return captureDiff;

    // Ưu tiên chiếu
    if (a.san.includes("+")) return -1;
    if (b.san.includes("+")) return 1;

    // Ưu tiên phong cấp
    if (a.promotion) return -1;
    if (b.promotion) return 1;

    return 0;
  });

  let bestMove = null;
  let bestValue = isMaximizingPlayer ? -Infinity : Infinity;

  for (const move of moves) {
    game.move(move);
    const result = minimax(game, depth - 1, !isMaximizingPlayer, alpha, beta);
    game.undo();

    if (isMaximizingPlayer) {
      if (result.evaluation > bestValue) {
        bestValue = result.evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestValue);
    } else {
      if (result.evaluation < bestValue) {
        bestValue = result.evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, bestValue);
    }

    if (beta <= alpha) break;
  }

  return { move: bestMove, evaluation: bestValue };
}
