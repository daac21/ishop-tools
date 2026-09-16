/* =========================================================
   iShop Arcade — Snake
   Se conecta a la app principal a través de buildScreen()
   en app.js (entry.screen === "snake").
   Usa las clases .game-* y .snake-* definidas en games/games.css,
   y las mismas variables de color de style.css (var(--accent), etc.)
   ========================================================= */
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

function buildSnake() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>🐍 Snake</h2><p>Usa los controles o las flechas del teclado. Come las manzanas sin chocar.</p>`;
  wrap.appendChild(heading);

  const SPEEDS = {
    lento:  { ms: 180, label: "Lento" },
    normal: { ms: 120, label: "Normal" },
    rapido: { ms: 80,  label: "Rápido" },
  };
  let speedKey = localStorage.getItem("ishop_snake_speed") || "normal";
  if (!SPEEDS[speedKey]) speedKey = "normal";

  const chipsRow = document.createElement("div");
  chipsRow.className = "chip-list";
  Object.keys(SPEEDS).forEach(key => {
    const chip = document.createElement("button");
    chip.className = "chip" + (key === speedKey ? " active" : "");
    chip.textContent = SPEEDS[key].label;
    chip.addEventListener("click", () => {
      speedKey = key;
      localStorage.setItem("ishop_snake_speed", key);
      chipsRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      startGame();
    });
    chipsRow.appendChild(chip);
  });
  wrap.appendChild(chipsRow);

  const statsRow = document.createElement("div");
  statsRow.className = "game-stats";
  wrap.appendChild(statsRow);

  const layout = document.createElement("div");
  layout.className = "snake-layout";

  const boardBox = document.createElement("div");
  boardBox.className = "game-board-box";
  const CELL = 18, COLS = 13, ROWS = 16;
  const canvas = document.createElement("canvas");
  canvas.width = CELL * COLS;
  canvas.height = CELL * ROWS;
  boardBox.appendChild(canvas);
  layout.appendChild(boardBox);

  const dpad = document.createElement("div");
  dpad.className = "snake-dpad";
  dpad.innerHTML = `
    <button class="dpad-up" data-dir="up">▲</button>
    <div class="dpad-center"></div>
    <button class="dpad-left" data-dir="left">◀</button>
    <div class="dpad-center"></div>
    <button class="dpad-right" data-dir="right">▶</button>
    <div class="dpad-center"></div>
    <button class="dpad-down" data-dir="down">▼</button>
    <div class="dpad-center"></div>
  `;
  layout.appendChild(dpad);
  wrap.appendChild(layout);

  const controlsRow = document.createElement("div");
  controlsRow.className = "game-controls";
  controlsRow.innerHTML = `<button class="scanner-manual-btn restart-btn">🔄 Reiniciar</button>`;
  wrap.appendChild(controlsRow);

  const msgBox = document.createElement("div");
  msgBox.className = "game-message";
  wrap.appendChild(msgBox);

  const ctx = canvas.getContext("2d");
  const ACCENT = "#34c759";
  const HEAD_COLOR = "#0071e3";
  const FOOD_COLOR = "#ff3b30";

  let snake, dir, nextDir, food, score, best, loopInterval, gameOver, started;
  best = Number(localStorage.getItem("ishop_snake_best") || 0);

  function placeFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function updateStats() {
    statsRow.innerHTML = `<span>🍎 ${score}</span><span>🏆 ${best}</span>`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = FOOD_COLOR;
    ctx.beginPath();
    ctx.roundRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4, 5);
    ctx.fill();

    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? HEAD_COLOR : ACCENT;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 5);
      ctx.fill();
    });
  }

  function endGame() {
    gameOver = true;
    clearInterval(loopInterval);
    if (score > best) {
      best = score;
      localStorage.setItem("ishop_snake_best", String(best));
    }
    msgBox.textContent = "💥 ¡Chocaste! Toca reiniciar para volver a intentar.";
    msgBox.className = "game-message game-lose";
    updateStats();
  }

  function tick() {
    if (gameOver) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { endGame(); return; }
    if (snake.some(s => s.x === head.x && s.y === head.y)) { endGame(); return; }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      updateStats();
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function setDir(x, y) {
    if (!started) return;
    // Evita que la serpiente se devuelva sobre sí misma
    if (dir.x === -x && dir.y === -y) return;
    nextDir = { x, y };
  }

  dpad.querySelectorAll("button[data-dir]").forEach(btn => {
    btn.addEventListener("click", () => {
      const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const [x, y] = map[btn.dataset.dir];
      setDir(x, y);
    });
  });

  function keyHandler(e) {
    const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (map[e.key]) {
      e.preventDefault();
      setDir(map[e.key][0], map[e.key][1]);
    }
  }
  document.addEventListener("keydown", keyHandler);

  // Deslizar sobre el tablero también mueve a la serpiente
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });
  canvas.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
    else setDir(0, dy > 0 ? 1 : -1);
  }, { passive: true });

  controlsRow.querySelector(".restart-btn").addEventListener("click", startGame);

  function startGame() {
    clearInterval(loopInterval);
    snake = [{ x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    gameOver = false;
    started = true;
    msgBox.textContent = "";
    msgBox.className = "game-message";
    placeFood();
    updateStats();
    draw();
    loopInterval = setInterval(tick, SPEEDS[speedKey].ms);
  }

  // Limpieza al salir de la pantalla (se detiene el loop y el listener de teclado)
  const observer = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      clearInterval(loopInterval);
      document.removeEventListener("keydown", keyHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  startGame();
  return wrap;
}
