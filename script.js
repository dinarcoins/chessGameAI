import { PIECE_SQUARE_TABLES } from "./constants.js";

// Khởi tạo game cờ vua
var game = new Chess();

// Lấy phần tử bàn cờ và trạng thái
var boardElement = document.getElementById("chessboard");
var statusElement = document.getElementById("status");

var btnPlayWithHuman = document.getElementById("btnPlayWithHuman");
var btnPlayWithAI = document.getElementById("btnPlayWithAI");
var btnBackToMenu = document.getElementById("btnBackToMenu");
var btnConfirmAction = document.getElementById("btnConfirmAction");
var btnCancelAction = document.getElementById("btnCancelAction");
var btnResetGame = document.getElementById("resetGame");
var btnUnMove = document.getElementById("btnUnMove");

var checkMateSound = document.createElement("audio");
checkMateSound.src = "./audio/checkMate.mp3";
var hitSound = document.createElement("audio");
hitSound.src = "./audio/hit.mp3";

var confirmCallback = null;

var pieceImages = {
  "♙": "./img/pawnWhite.png",
  "♖": "./img/rookWhite.png",
  "♘": "./img/knightWhite.png",
  "♗": "./img/bishopWhite.png",
  "♕": "./img/queenWhite.png",
  "♔": "./img/kingWhite.png",
  "♟": "./img/pawnBlack.png",
  "♜": "./img/rookBlack.png",
  "♞": "./img/knightBlack.png",
  "♝": "./img/bishopBlack.png",
  "♛": "./img/queenBlack.png",
  "♚": "./img/kingBlack.png",
};

// Hàm để vẽ bàn cờ

document.addEventListener("DOMContentLoaded", function () {
  btnPlayWithHuman.addEventListener("click", function () {
    startGame("human");
  });

  btnPlayWithAI.addEventListener("click", function () {
    startGame("ai");
  });

  btnBackToMenu.addEventListener("click", function () {
    showConfirm("Bạn có chắc chắn muốn về menu chính?", backToMenu);
  });

  btnConfirmAction.addEventListener("click", function () {
    confirmAction(true);
  });

  btnCancelAction.addEventListener("click", function () {
    confirmAction(false);
  });

  btnResetGame.addEventListener("click", function () {
    showConfirm("Bạn có chắc chắn muốn về menu chính?", resetGame());
    // showNotification("success", "Đã reset game!");
  });

  btnUnMove.addEventListener("click", function () {
    undoLastMove();
  });
});

function backToMenu() {
  document.getElementById("menu").style.display = "flex";
  document.getElementById("game").style.display = "none";
}

function showConfirm(message, callback) {
  document.getElementById("confirmMessage").innerText = message;
  document.getElementById("confirmModal").style.display = "flex";
  confirmCallback = callback;
  // gamePaused = true; // Tạm dừng trò chơi
}

function confirmAction(confirm) {
  document.getElementById("confirmModal").style.display = "none";
  // gamePaused = false; // Tiếp tục trò chơi nếu chọn không
  if (confirm && confirmCallback) {
    confirmCallback();
    resetGame();
  }
}

function showNotification(status, message) {
  const container = document.getElementById("notification-container");

  const notification = document.createElement("div");
  const sound = document.createElement("audio");
  sound.src = "./audio/pop.mp3";
  notification.classList.add("notification", status);
  notification.textContent = message;

  container.appendChild(notification);
  sound.play();
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

function startGame() {
  console.log("startGame");
  var playerName = document.getElementById("playerName").value.trim();
  if (playerName === "") {
    showNotification("error", "Hãy cho tại hạ biết danh của tác hạ!");
    return;
  }
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
}

function drawBoard() {
  boardElement.innerHTML = "";

  for (var row = 0; row < 8; row++) {
    for (var col = 0; col < 8; col++) {
      var square = document.createElement("div");
      square.className = (row + col) % 2 === 0 ? "square light" : "square dark";
      square.dataset.row = row;
      square.dataset.col = col;

      var squareName = String.fromCharCode(97 + col) + (8 - row);
      var piece = game.get(squareName);
      if (piece) {
        var img = document.createElement("img");
        var symbol = getPieceSymbol(piece);
        img.src = pieceImages[symbol];
        img.alt = piece.type;
        img.classList.add("piece-image");
        square.appendChild(img);
      }

      square.addEventListener("click", function () {
        handleSquareClick(this); // Or whatever your click handler is
      });

      boardElement.appendChild(square);
    }
  }
}

// Hàm để lấy ký hiệu quân cờ
function getPieceSymbol(piece) {
  var symbols = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };
  return (
    symbols[piece.color === "w" ? piece.type.toUpperCase() : piece.type] || ""
  );
}

// Biến để lưu trữ nước đi được chọn
var selectedSquare = null;

// Hàm xử lý khi người dùng click vào ô cờ
function handleSquareClick(square) {
  var row = parseInt(square.dataset.row);
  var col = parseInt(square.dataset.col);
  var to = { row: row, col: col };

  // Bỏ class `selected` khỏi ô trước đó
  document
    .querySelectorAll(".square.selected")
    .forEach((sq) => sq.classList.remove("selected"));

  // Bỏ class `possible-move` khỏi các ô cũ
  document
    .querySelectorAll(".square.possible-move")
    .forEach((sq) => sq.classList.remove("possible-move"));

  if (selectedSquare) {
    var fromPosition =
      String.fromCharCode(97 + selectedSquare.col) + (8 - selectedSquare.row);
    var toPosition = String.fromCharCode(97 + to.col) + (8 - to.row);

    var move = game.move({
      from: fromPosition,
      to: toPosition,
      promotion: game.turn() === "w" ? "q" : "Q",
    });

    if (move) {
      drawBoard();
      updateStatus();

      if (!game.game_over()) {
        setTimeout(makeAIMove, 1000);
      }
    }

    selectedSquare = null;
  } else {
    var squareName = String.fromCharCode(97 + col) + (8 - row);
    var piece = game.get(squareName);

    if (piece && piece.color === game.turn()) {
      selectedSquare = to;
      square.classList.add("selected");

      // Hiển thị các nước đi hợp lệ
      var moves = game.moves({ square: squareName, verbose: true });
      moves.forEach((move) => {
        var targetSquare = document.querySelector(
          `[data-row='${8 - move.to[1]}' ][data-col='${
            move.to.charCodeAt(0) - 97
          }']`
        );
        if (targetSquare) {
          targetSquare.classList.add("possible-move");
        }
      });
    }
  }
}

// Hàm để cập nhật trạng thái game

function updateStatus() {
  var statusMessage = "";

  switch (true) {
    case game.in_checkmate():
      statusMessage.textContent =
        "Checkmate! " + (game.turn() === "w" ? "Black wins!" : "White wins!");
      break;

    case game.in_stalemate():
      statusMessage = "Stalemate! Trận đấu hòa do không còn nước đi hợp lệ.";
      break;

    case game.in_draw():
      statusMessage = "Draw! Trận đấu kết thúc với tỷ số hòa.";
      break;

    case game.in_check():
      statusMessage = "King in check!";
      showNotification("warning", "King is check!");
      break;

    default:
      statusMessage = game.turn() === "w" ? "White" : "Black" + " to move";
  }

  statusElement.textContent = statusMessage;
}

// Hàm để reset game
function resetGame() {
  game.reset();
  drawBoard();
  updateStatus();
}

function undoLastMove() {
  var lastMove = game.undo(); // Hoàn tác nước đi cuối cùng
  if (lastMove) {
    drawBoard();
    updateStatus();
    selectedSquare = null; // Xóa trạng thái ô được chọn
  } else {
    showNotification("error", "Không thể hoàn tác!");
  }
}

// ------------------ Hàm để AI thực hiện nước đi ------------------ //

function makeAIMove() {
  var bestMove = minimax(game, 5, true, -Infinity, Infinity).move;
  if (bestMove) {
    game.move(bestMove);
    drawBoard();
    updateStatus();
  }
}

// ------------------ Các hàm hỗ trợ mới ------------------ //

// Bảng điểm vị trí cho các quân (Ví dụ cho quân Trắng, đảo ngược cho quân Đen)

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
  const kingSquare = game
    .board()
    .flat()
    .find((p) => p && p.type === "k" && p.color === color);
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
    const x = kingSquare.col + dx;
    const y = kingSquare.row + dy;
    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      const piece = game.board()[y][x];
      if (piece && piece.color === color) safety += 1;
    }
  });
  return safety * 2;
}

// Đánh giá cấu trúc Tốt
function evaluatePawnStructure(game, color) {
  let score = 0;
  const pawns = [];

  // Tìm tất cả tốt
  game.board().forEach((row, y) => {
    row.forEach((piece, x) => {
      if (piece && piece.type === "p" && piece.color === color) {
        pawns.push({ x, y });
      }
    });
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

// ------------------ Cải tiến hàm evaluateBoard ------------------ //
function evaluateBoard(game) {
  let evaluation = 0;
  const phase = getGamePhase(game);

  // Duyệt qua tất cả ô cờ
  game.board().forEach((row, y) => {
    row.forEach((piece, x) => {
      if (!piece) return;

      // Giá trị cơ bản của quân
      const pieceValue = getPieceValue(piece.type);
      const sign = piece.color === "w" ? 1 : -1;

      // Giá trị vị trí
      let positionValue = 0;
      if (PIECE_SQUARE_TABLES[piece.type.toUpperCase()]) {
        const table = PIECE_SQUARE_TABLES[piece.type.toUpperCase()];
        const row = piece.color === "w" ? 7 - y : y;
        positionValue = table[row][x] || 0;
      }

      evaluation +=
        sign * (pieceValue + positionValue * (phase === 2 ? 0.5 : 1));
    });
  });

  // Thêm các yếu tố phụ
  evaluation +=
    evaluateCenterControl(game, "w") - evaluateCenterControl(game, "b");
  evaluation += evaluateKingSafety(game, "w") - evaluateKingSafety(game, "b");
  evaluation +=
    evaluatePawnStructure(game, "w") - evaluatePawnStructure(game, "b");

  return evaluation;
}

// ------------------ Cải tiến minimax với move ordering ------------------ //
function minimax(game, depth, isMaximizingPlayer, alpha, beta) {
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

// ------------------ Hàm getPieceValue cập nhật ------------------ //
function getPieceValue(pieceType) {
  const values = {
    p: 1,
    n: 3,
    b: 3.2,
    r: 5,
    q: 9,
    k: 0, // Vua không có giá trị
    P: 1,
    N: 3,
    B: 3.2,
    R: 5,
    Q: 9,
    K: 0,
  };
  return values[pieceType] || 0;
}

// function minimax(game, depth, isMaximizingPlayer, alpha, beta) {
//   if (depth === 0 || game.game_over()) {
//     return { move: null, evaluation: evaluateBoard(game) };
//   }

//   var moves = game.moves({ verbose: true });

//   // Ưu tiên ăn quân địch (sắp xếp theo giá trị quân cờ)
//   moves.sort((a, b) => {
//     let valueA = a.captured ? getPieceValue(a.captured) : 0;
//     let valueB = b.captured ? getPieceValue(b.captured) : 0;
//     return valueB - valueA; // Nước đi nào ăn quân có giá trị cao hơn sẽ được ưu tiên
//   });

//   var bestMove = null;
//   if (isMaximizingPlayer) {
//     let maxEval = -Infinity;
//     for (let move of moves) {
//       game.move(move);
//       let evaluation = minimax(game, depth - 1, false, alpha, beta).evaluation;
//       game.undo();

//       if (evaluation > maxEval) {
//         maxEval = evaluation;
//         bestMove = move;
//       }

//       alpha = Math.max(alpha, evaluation);
//       if (beta <= alpha) break; // Cắt tỉa Alpha-Beta
//     }
//     return { move: bestMove, evaluation: maxEval };
//   } else {
//     let minEval = Infinity;
//     for (let move of moves) {
//       game.move(move);
//       let evaluation = minimax(game, depth - 1, true, alpha, beta).evaluation;
//       game.undo();

//       if (evaluation < minEval) {
//         minEval = evaluation;
//         bestMove = move;
//       }

//       beta = Math.min(beta, evaluation);
//       if (beta <= alpha) break; // Cắt tỉa Alpha-Beta
//     }
//     return { move: bestMove, evaluation: minEval };
//   }
// }

// function getPieceValue(piece) {
//   var values = { p: 1, r: 5, n: 3, b: 3, q: 9, k: 100 };
//   return values[piece.toLowerCase()] || 0; // Trả về giá trị quân cờ, mặc định 0 nếu không có
// }

// function evaluateBoard(game) {
//   var pieceValues = {
//     p: -1,
//     r: -5,
//     n: -3,
//     b: -3,
//     q: -9,
//     k: -100,
//     P: 1,
//     R: 5,
//     N: 3,
//     B: 3,
//     Q: 9,
//     K: 100,
//   };

//   var board = game.fen().split(" ")[0]; // Lấy trạng thái bàn cờ từ FEN
//   var evaluation = 0;

//   for (var char of board) {
//     if (pieceValues[char]) {
//       evaluation += pieceValues[char];
//     }
//   }

//   return evaluation;
// }

// Khởi tạo bàn cờ ban đầu
drawBoard();
updateStatus();
