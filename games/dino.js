/* =========================================================
   iShop Arcade — Dino Run
   Se conecta a la app principal a través de buildScreen()
   en app.js (entry.screen === "dino").
   Usa las clases .game-* definidas en games/games.css, con los
   mismos colores que el resto de la app.
   ========================================================= */
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

function buildDino() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>🦖 Dino Run</h2><p>Toca el tablero, la barra espaciadora o el botón para saltar los obstáculos.</p>`;
  wrap.appendChild(heading);

  const statsRow = document.createElement("div");
  statsRow.className = "game-stats";
  wrap.appendChild(statsRow);

  const boardBox = document.createElement("div");
  boardBox.className = "game-board-box";
  const W = 280, H = 130;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  boardBox.appendChild(canvas);
  wrap.appendChild(boardBox);

  const controlsRow = document.createElement("div");
  controlsRow.className = "game-controls";
  controlsRow.innerHTML = `
    <button class="scanner-manual-btn jump-btn">⬆️ Saltar</button>
    <button class="scanner-manual-btn restart-btn">🔄 Reiniciar</button>
  `;
  wrap.appendChild(controlsRow);

  const msgBox = document.createElement("div");
  msgBox.className = "game-message";
  wrap.appendChild(msgBox);

  const ctx = canvas.getContext("2d");
  const GROUND_Y = H - 22;
  const DINO_X = 26, DINO_SIZE = 24;
  const GRAVITY = 0.0026;   // px/ms²
  const JUMP_V = 0.66;      // impulso inicial del salto (px/ms)

  let best = Number(localStorage.getItem("ishop_dino_best") || 0);

  let dinoY, dinoVY, onGround, obstacles, score, speed, gameOver, started, rafId, lastT, spawnTimer;

  function updateStats() {
    statsRow.innerHTML = `<span>🏃 ${Math.floor(score)}</span><span>🏆 ${Math.floor(best)}</span>`;
  }

  function spawnObstacle() {
    const isBird = score > 120 && Math.random() < 0.32;
    if (isBird) {
      obstacles.push({ x: W + 10, w: 20, h: 14, y: GROUND_Y - (Math.random() < 0.5 ? 40 : 16), bird: true });
    } else {
      const h = 20 + Math.random() * 12;
      obstacles.push({ x: W + 10, w: 12 + Math.random() * 8, h, y: GROUND_Y - h, bird: false });
    }
  }

  function reset() {
    dinoY = 0;
    dinoVY = 0;
    onGround = true;
    obstacles = [];
    score = 0;
    speed = 0.2;
    gameOver = false;
    started = true;
    spawnTimer = 900;
    lastT = null;
    msgBox.textContent = "";
    msgBox.className = "game-message";
    updateStats();
  }

  function jump() {
    if (!started || gameOver) return;
    if (onGround) {
      dinoVY = JUMP_V;
      onGround = false;
    }
  }

  function endGame() {
    gameOver = true;
    cancelAnimationFrame(rafId);
    if (score > best) {
      best = score;
      localStorage.setItem("ishop_dino_best", String(Math.floor(best)));
    }
    msgBox.textContent = "💥 ¡Chocaste! Toca reiniciar para volver a intentar.";
    msgBox.className = "game-message game-lose";
    updateStats();
  }

  function dinoBox() {
    return { x: DINO_X, y: GROUND_Y - DINO_SIZE - dinoY, w: DINO_SIZE, h: DINO_SIZE };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = "#c7cad0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    const db = dinoBox();
    ctx.fillStyle = "#1d1d1f";
    ctx.beginPath();
    ctx.roundRect(db.x, db.y, db.w, db.h, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(db.x + db.w - 7, db.y + 7, 2.3, 0, Math.PI * 2);
    ctx.fill();

    obstacles.forEach(o => {
      ctx.fillStyle = o.bird ? "#ff3b30" : "#34c759";
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, o.h, 4);
      ctx.fill();
    });
  }

  function tick(t) {
    if (gameOver) return;
    if (lastT === null) lastT = t;
    const dt = Math.min(t - lastT, 40);
    lastT = t;

    if (!onGround) {
      dinoVY -= GRAVITY * dt;
      dinoY += dinoVY * dt;
      if (dinoY <= 0) { dinoY = 0; dinoVY = 0; onGround = true; }
    }

    speed = Math.min(0.2 + score / 2600, 0.46);
    obstacles.forEach(o => { o.x -= speed * dt; });
    obstacles = obstacles.filter(o => o.x + o.w > -5);

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = Math.max(650 - score * 1.2, 300) + Math.random() * 380;
    }

    score += dt * 0.06;
    updateStats();

    const db = dinoBox();
    for (const o of obstacles) {
      if (overlap(db, { x: o.x, y: o.y, w: o.w, h: o.h })) { endGame(); return; }
    }

    draw();
    rafId = requestAnimationFrame(tick);
  }

  canvas.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); }, { passive: false });
  canvas.addEventListener("mousedown", jump);
  controlsRow.querySelector(".jump-btn").addEventListener("click", jump);
  controlsRow.querySelector(".restart-btn").addEventListener("click", startGame);

  function keyHandler(e) {
    if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); }
  }
  document.addEventListener("keydown", keyHandler);

  function startGame() {
    cancelAnimationFrame(rafId);
    reset();
    draw();
    rafId = requestAnimationFrame(tick);
  }

  // Limpieza al salir de la pantalla (se detiene el loop y el listener de teclado)
  const observer = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", keyHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  startGame();
  return wrap;
}
