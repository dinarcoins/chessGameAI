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
    resetGame();
    showNotification("success", "Đã reset game!");
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
  playerName = document.getElementById("playerName").value.trim();
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
  if (game.in_checkmate()) {
    statusElement.textContent =
      "Checkmate! " + (game.turn() === "w" ? "Black wins!" : "White wins!");
  } else if (game.in_draw()) {
    statusElement.textContent = "Draw!";
  } else if (game.in_check()) {
    statusElement.textContent = "King in check! ";
    showNotification("warning", "King is check!");
  } else {
    statusElement.textContent =
      game.turn() === "w" ? "White to move" : "Black to move";
  }
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
// function makeAIMove() {
//   var moves = game.moves();
//   var randomMove = moves[Math.floor(Math.random() * moves.length)];
//   game.move(randomMove);
//   drawBoard();
//   updateStatus();
// }

function makeAIMove() {
  var bestMove = minimax(game, 4, true, -Infinity, Infinity).move;
  if (bestMove) {
    game.move(bestMove);
    drawBoard();
    updateStatus();

  }
}

function minimax(game, depth, isMaximizingPlayer, alpha, beta) {
  if (depth === 0 || game.game_over()) {
    return { move: null, evaluation: evaluateBoard(game) };
  }

  var moves = game.moves({ verbose: true });

  // Ưu tiên ăn quân địch (sắp xếp theo giá trị quân cờ)
  moves.sort((a, b) => {
    let valueA = a.captured ? getPieceValue(a.captured) : 0;
    let valueB = b.captured ? getPieceValue(b.captured) : 0;
    return valueB - valueA; // Nước đi nào ăn quân có giá trị cao hơn sẽ được ưu tiên
  });

  var bestMove = null;
  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (let move of moves) {
      game.move(move);
      let evaluation = minimax(game, depth - 1, false, alpha, beta).evaluation;
      game.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }

      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Cắt tỉa Alpha-Beta
    }
    return { move: bestMove, evaluation: maxEval };
  } else {
    let minEval = Infinity;
    for (let move of moves) {
      game.move(move);
      let evaluation = minimax(game, depth - 1, true, alpha, beta).evaluation;
      game.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }

      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Cắt tỉa Alpha-Beta
    }
    return { move: bestMove, evaluation: minEval };
  }
}

function getPieceValue(piece) {
  var values = { p: 1, r: 5, n: 3, b: 3, q: 9, k: 100 };
  return values[piece.toLowerCase()] || 0; // Trả về giá trị quân cờ, mặc định 0 nếu không có
}

function evaluateBoard(game) {
  var pieceValues = {
    p: -1,
    r: -5,
    n: -3,
    b: -3,
    q: -9,
    k: -100,
    P: 1,
    R: 5,
    N: 3,
    B: 3,
    Q: 9,
    K: 100,
  };

  var board = game.fen().split(" ")[0]; // Lấy trạng thái bàn cờ từ FEN
  var evaluation = 0;

  for (var char of board) {
    if (pieceValues[char]) {
      evaluation += pieceValues[char];
    }
  }

  return evaluation;
}

// Khởi tạo bàn cờ ban đầu
drawBoard();
updateStatus();
