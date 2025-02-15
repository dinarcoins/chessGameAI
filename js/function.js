export function showNotification(status, message) {
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
// ------------------ Hàm getPieceValue cập nhật ------------------ //
export function getPieceValue(pieceType) {
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

// Hàm để lấy ký hiệu quân cờ
export function getPieceSymbol(piece) {
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

export function backToMenu() {
  document.getElementById("menu").style.display = "flex";
  document.getElementById("game").style.display = "none";
}

export function startGame() {
  console.log("startGame");
  var playerName = document.getElementById("playerName").value.trim();
  if (playerName === "") {
    showNotification("error", "Hãy cho tại hạ biết danh của tác hạ!");
    return;
  }
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
}
