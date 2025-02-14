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
      console.log("piece", piece); // Thêm dòng này để kiểm tra
      if (piece) {
        var img = document.createElement("img");
        var symbol = getPieceSymbol(piece);
        console.log("Piece symbol:", symbol); // Thêm dòng này để kiểm tra
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
  console.log("Piece type:", piece.type);
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
      promotion: "q",
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

// Hàm để AI thực hiện nước đi
function makeAIMove() {
  var moves = game.moves();
  var randomMove = moves[Math.floor(Math.random() * moves.length)];
  game.move(randomMove);
  drawBoard();
  updateStatus();
}

// Hàm để cập nhật trạng thái game
function updateStatus() {
  if (game.in_checkmate()) {
    statusElement.textContent =
      "Checkmate! " + (game.turn() === "w" ? "Black wins!" : "White wins!");
  } else if (game.in_draw()) {
    statusElement.textContent = "Draw!";
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

// Khởi tạo bàn cờ ban đầu
drawBoard();
updateStatus();
