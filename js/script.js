import { pieceImages } from "./constants.js";
import {
  showNotification,
  getPieceSymbol,
  getPieceValue,
  backToMenu,
  startGame,
} from "./function.js";
import { minimax } from "./botAI.js";

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
// Biến để lưu trữ nước đi được chọn
var selectedSquare = null;

// Khởi tạo âm thanh
var checkMateSound = document.createElement("audio");
checkMateSound.src = "./audio/checkMate.mp3";
var hitSound = document.createElement("audio");
hitSound.src = "./audio/hit.mp3";

var confirmCallback = null;

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

function showConfirm(message, callback) {
  document.getElementById("confirmMessage").innerText = message;
  document.getElementById("confirmModal").style.display = "flex";
  confirmCallback = callback;
}

function confirmAction(confirm) {
  document.getElementById("confirmModal").style.display = "none";
  if (confirm && confirmCallback) {
    confirmCallback();
    resetGame();
  }
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
        setTimeout(makeAIMove, 500);
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
  switch (true || "") {
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
      statusMessage = game.turn() === "w" ? "White to move" : "Black to move";
  }
  statusElement.textContent = statusMessage;
}

// Hàm để reset game
function resetGame() {
  game.reset();
  drawBoard();
  updateStatus();
}

// Hàm để hoàn tác nước cờ đã đánh
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
  var bestMove = minimax(game, 3, true, -Infinity, Infinity).move;
  if (bestMove) {
    game.move(bestMove);
    drawBoard();
    updateStatus();
  }
}

// Khởi tạo bàn cờ ban đầu
drawBoard();
updateStatus();
