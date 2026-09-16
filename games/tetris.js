/* =========================================================
   iShop Arcade — Tetris
   Se conecta a la app principal a través de buildScreen()
   en app.js (entry.screen === "tetris").
   Usa las clases .game-* y .tetris-* definidas en games/games.css,
   con colores tomados de la misma paleta que el resto de la app.
   ========================================================= */

const TETRIS_PIECES = {
  I: { color: "#0071e3", shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  O: { color: "#ff9500", shape: [[1,1],[1,1]] },
  T: { color: "#5856d6", shape: [[0,1,0],[1,1,1],[0,0,0]] },
  S: { color: "#34c759", shape: [[0,1,1],[1,1,0],[0,0,0]] },
  Z: { color: "#ff3b30", shape: [[1,1,0],[0,1,1],[0,0,0]] },
  J: { color: "#af52de", shape: [[1,0,0],[1,1,1],[0,0,0]] },
  L: { color: "#8e8e93", shape: [[0,0,1],[1,1,1],[0,0,0]] },
};

// Polyfill por si el WebView no soporta CanvasRenderingContext2D.roundRect
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

function tetrisRotateMatrix(m) {
  const n = m.length;
  const res = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      res[c][n - 1 - r] = m[r][c];
    }
  }
  return res;
}

function buildTetris() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>🧱 Tetris</h2><p>Acomoda las piezas y completa líneas. Usa los controles o el teclado.</p>`;
  wrap.appendChild(heading);

  const statsRow = document.createElement("div");
  statsRow.className = "game-stats";
  wrap.appendChild(statsRow);

  const layout = document.createElement("div");
  layout.className = "tetris-layout";

  const boardBox = document.createElement("div");
  boardBox.className = "game-board-box";
  const COLS = 10, ROWS = 18, CELL = 18;
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  boardBox.appendChild(canvas);
  layout.appendChild(boardBox);

  const side = document.createElement("div");
  side.className = "tetris-side";
  side.innerHTML = `
    <div class="tetris-next-box">
      <p>Siguiente</p>
      <canvas class="tetris-next-canvas" width="72" height="72"></canvas>
    </div>
  `;
  layout.appendChild(side);
  wrap.appendChild(layout);

  const controlsRow = document.createElement("div");
  controlsRow.className = "tetris-controls";
  controlsRow.innerHTML = `
    <button class="left-btn" aria-label="Izquierda">◀</button>
    <button class="down-btn" aria-label="Bajar">▼</button>
    <button class="rotate-btn" aria-label="Girar">⟲</button>
    <button class="right-btn" aria-label="Derecha">▶</button>
    <button class="drop-btn scanner-manual-btn">⤓ Caída rápida</button>
  `;
  wrap.appendChild(controlsRow);

  const restartRow = document.createElement("div");
  restartRow.className = "game-controls";
  restartRow.innerHTML = `<button class="scanner-manual-btn restart-btn">🔄 Reiniciar</button>`;
  wrap.appendChild(restartRow);

  const msgBox = document.createElement("div");
  msgBox.className = "game-message";
  wrap.appendChild(msgBox);

  const ctx = canvas.getContext("2d");
  const nextCanvas = side.querySelector(".tetris-next-canvas");
  const nextCtx = nextCanvas.getContext("2d");

  let board, current, nextKey, score, lines, level, best, gameOver, dropInterval, loopTimer;
  best = Number(localStorage.getItem("ishop_tetris_best") || 0);

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function randomKey() {
    const keys = Object.keys(TETRIS_PIECES);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function spawnPiece(key) {
    const def = TETRIS_PIECES[key];
    const shape = def.shape.map(row => row.slice());
    return {
      key, color: def.color, shape,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0,
    };
  }

  function collide(shape, offX, offY) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = offX + c, by = offY + r;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
    }
    return false;
  }

  function merge() {
    current.shape.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v && current.y + r >= 0) board[current.y + r][current.x + c] = current.color;
      });
    });
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(cell => cell)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] || 800;
      score += points * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(110, 600 - (level - 1) * 45);
      scheduleLoop();
    }
    return cleared;
  }

  function updateStats() {
    statsRow.innerHTML = `<span>⭐ ${score}</span><span>📏 Líneas ${lines}</span><span>🎚️ Nivel ${level}</span><span>🏆 ${best}</span>`;
  }

  function drawCell(context, x, y, size, color) {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x + 1, y + 1, size - 2, size - 2, 4);
    context.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) drawCell(ctx, c * CELL, r * CELL, CELL, board[r][c]);
      }
    }
    if (current) {
      current.shape.forEach((row, r) => {
        row.forEach((v, c) => {
          if (v) drawCell(ctx, (current.x + c) * CELL, (current.y + r) * CELL, CELL, current.color);
        });
      });
    }

    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const def = TETRIS_PIECES[nextKey];
    const size = 16;
    const offX = (nextCanvas.width - def.shape[0].length * size) / 2;
    const offY = (nextCanvas.height - def.shape.length * size) / 2;
    def.shape.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v) drawCell(nextCtx, offX + c * size, offY + r * size, size, def.color);
      });
    });
  }

  function endGame() {
    gameOver = true;
    clearTimeout(loopTimer);
    if (score > best) {
      best = score;
      localStorage.setItem("ishop_tetris_best", String(best));
    }
    msgBox.textContent = "💥 ¡Se llenó el tablero! Toca reiniciar para jugar de nuevo.";
    msgBox.className = "game-message game-lose";
    updateStats();
  }

  function lockPiece() {
    merge();
    clearLines();
    current = spawnPiece(nextKey);
    nextKey = randomKey();
    if (collide(current.shape, current.x, current.y)) {
      draw();
      endGame();
    }
  }

  function drop() {
    if (gameOver) return;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
    draw();
  }

  function hardDrop() {
    if (gameOver) return;
    while (!collide(current.shape, current.x, current.y + 1)) current.y++;
    lockPiece();
    draw();
  }

  function moveHorizontal(dx) {
    if (gameOver) return;
    if (!collide(current.shape, current.x + dx, current.y)) {
      current.x += dx;
      draw();
    }
  }

  function rotatePiece() {
    if (gameOver) return;
    const rotated = tetrisRotateMatrix(current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (!collide(rotated, current.x + k, current.y)) {
        current.shape = rotated;
        current.x += k;
        draw();
        return;
      }
    }
  }

  function scheduleLoop() {
    clearTimeout(loopTimer);
    if (gameOver) return;
    loopTimer = setTimeout(function step() {
      drop();
      if (!gameOver) loopTimer = setTimeout(step, dropInterval);
    }, dropInterval);
  }

  controlsRow.querySelector(".left-btn").addEventListener("click", () => moveHorizontal(-1));
  controlsRow.querySelector(".right-btn").addEventListener("click", () => moveHorizontal(1));
  controlsRow.querySelector(".down-btn").addEventListener("click", drop);
  controlsRow.querySelector(".rotate-btn").addEventListener("click", rotatePiece);
  controlsRow.querySelector(".drop-btn").addEventListener("click", hardDrop);
  restartRow.querySelector(".restart-btn").addEventListener("click", startGame);

  function keyHandler(e) {
    if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) e.preventDefault();
    if (e.key === "ArrowLeft") moveHorizontal(-1);
    else if (e.key === "ArrowRight") moveHorizontal(1);
    else if (e.key === "ArrowDown") drop();
    else if (e.key === "ArrowUp") rotatePiece();
    else if (e.key === " ") hardDrop();
  }
  document.addEventListener("keydown", keyHandler);

  function startGame() {
    clearTimeout(loopTimer);
    board = emptyBoard();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 600;
    gameOver = false;
    msgBox.textContent = "";
    msgBox.className = "game-message";
    nextKey = randomKey();
    current = spawnPiece(randomKey());
    updateStats();
    draw();
    scheduleLoop();
  }

  // Limpieza al salir de la pantalla (se detiene el loop y el listener de teclado)
  const observer = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      clearTimeout(loopTimer);
      document.removeEventListener("keydown", keyHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  startGame();
  return wrap;
}
