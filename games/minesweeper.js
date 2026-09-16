/* =========================================================
   iShop Arcade — Buscaminas
   Se conecta a la app principal a través de buildScreen()
   en app.js (entry.screen === "minesweeper").
   Usa las clases .mine-* definidas en games/games.css.
   ========================================================= */

/* ---- Buscaminas ---- */
function buildMinesweeper() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>💣 Buscaminas</h2><p>Descubre todas las casillas sin pisar una mina. Mantén presionado para poner una bandera.</p>`;
  wrap.appendChild(heading);

  const DIFFICULTIES = {
    facil:   { rows: 8,  cols: 8,  mines: 10, label: "Fácil" },
    medio:   { rows: 10, cols: 10, mines: 18, label: "Medio" },
    dificil: { rows: 14, cols: 10, mines: 30, label: "Difícil" },
  };

  let diffKey = localStorage.getItem("ishop_mine_diff") || "facil";
  if (!DIFFICULTIES[diffKey]) diffKey = "facil";

  const chipsRow = document.createElement("div");
  chipsRow.className = "chip-list";
  Object.keys(DIFFICULTIES).forEach(key => {
    const chip = document.createElement("button");
    chip.className = "chip" + (key === diffKey ? " active" : "");
    chip.textContent = DIFFICULTIES[key].label;
    chip.addEventListener("click", () => {
      diffKey = key;
      localStorage.setItem("ishop_mine_diff", key);
      chipsRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      startGame();
    });
    chipsRow.appendChild(chip);
  });
  wrap.appendChild(chipsRow);

  const statsRow = document.createElement("div");
  statsRow.className = "mine-stats";
  wrap.appendChild(statsRow);

  const boardBox = document.createElement("div");
  boardBox.className = "mine-board-box";
  wrap.appendChild(boardBox);

  const controlsRow = document.createElement("div");
  controlsRow.className = "mine-controls";
  controlsRow.innerHTML = `
    <button class="chip flag-toggle-btn">🚩 Modo bandera</button>
    <button class="scanner-manual-btn restart-btn">🔄 Reiniciar</button>
  `;
  wrap.appendChild(controlsRow);

  const msgBox = document.createElement("div");
  msgBox.className = "mine-message";
  wrap.appendChild(msgBox);

  const NUM_COLORS = ["", "#0071e3", "#34c759", "#ff3b30", "#5856d6", "#af52de", "#ff9500", "#1d1d1f", "#8e8e93"];

  let grid = [];
  let rows, cols, minesCount;
  let started = false;
  let gameOver = false;
  let flagMode = false;
  let timer = 0;
  let timerInterval = null;
  let revealedCount = 0;

  const flagToggleBtn = controlsRow.querySelector(".flag-toggle-btn");
  const restartBtn = controlsRow.querySelector(".restart-btn");

  flagToggleBtn.addEventListener("click", () => {
    flagMode = !flagMode;
    flagToggleBtn.classList.toggle("active", flagMode);
  });
  restartBtn.addEventListener("click", startGame);

  function updateStats() {
    const flags = grid.flat().filter(c => c.flagged).length;
    statsRow.innerHTML = `<span>💣 ${Math.max(minesCount - flags, 0)}</span><span>⏱️ ${timer}s</span>`;
  }

  function forEachNeighbor(r, c, fn) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) fn(nr, nc);
      }
    }
  }

  function placeMines(excludeRow, excludeCol) {
    let placed = 0;
    while (placed < minesCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (grid[r][c].mine) continue;
      if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
      grid[r][c].mine = true;
      placed++;
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].mine) continue;
        let count = 0;
        forEachNeighbor(r, c, (nr, nc) => { if (grid[nr][nc].mine) count++; });
        grid[r][c].adj = count;
      }
    }
  }

  function revealCell(r, c) {
    if (gameOver) return;
    const cell = grid[r][c];
    if (cell.revealed || cell.flagged) return;

    if (!started) {
      started = true;
      placeMines(r, c);
      timerInterval = setInterval(() => { timer++; updateStats(); }, 1000);
    }

    cell.revealed = true;
    revealedCount++;

    if (cell.mine) {
      endGame(false);
      return;
    }

    if (cell.adj === 0) {
      forEachNeighbor(r, c, (nr, nc) => {
        if (!grid[nr][nc].revealed && !grid[nr][nc].flagged) revealCell(nr, nc);
      });
    }

    if (!gameOver && revealedCount === rows * cols - minesCount) {
      endGame(true);
    }
  }

  function toggleFlag(r, c) {
    if (gameOver) return;
    const cell = grid[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
  }

  function endGame(won) {
    gameOver = true;
    clearInterval(timerInterval);
    grid.flat().forEach(cell => { if (cell.mine) cell.revealed = true; });
    msgBox.textContent = won ? "🎉 ¡Ganaste!" : "💥 ¡Boom! Inténtalo de nuevo.";
    msgBox.className = "mine-message " + (won ? "mine-win" : "mine-lose");
  }

  function renderBoard() {
    boardBox.innerHTML = "";
    const boardEl = document.createElement("div");
    boardEl.className = "mine-board";
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const btn = document.createElement("button");
        btn.className = "mine-cell" + (cell.revealed ? " revealed" : "") + (cell.revealed && cell.mine ? " mine-hit" : "");

        if (cell.flagged && !cell.revealed) {
          btn.textContent = "🚩";
        } else if (cell.revealed) {
          if (cell.mine) btn.textContent = "💣";
          else if (cell.adj > 0) {
            btn.textContent = String(cell.adj);
            btn.style.color = NUM_COLORS[cell.adj];
          }
        }

        let pressTimer = null;
        let longPressed = false;

        btn.addEventListener("pointerdown", () => {
          longPressed = false;
          pressTimer = setTimeout(() => {
            longPressed = true;
            toggleFlag(r, c);
            renderBoard();
            updateStats();
          }, 450);
        });
        btn.addEventListener("pointerup", () => {
          clearTimeout(pressTimer);
          if (longPressed) return;
          if (flagMode) toggleFlag(r, c);
          else revealCell(r, c);
          renderBoard();
          updateStats();
        });
        btn.addEventListener("pointerleave", () => clearTimeout(pressTimer));
        btn.addEventListener("contextmenu", (e) => e.preventDefault());

        boardEl.appendChild(btn);
      }
    }
    boardBox.appendChild(boardEl);
  }

  function startGame() {
    const d = DIFFICULTIES[diffKey];
    rows = d.rows; cols = d.cols; minesCount = d.mines;
    started = false;
    gameOver = false;
    revealedCount = 0;
    flagMode = false;
    flagToggleBtn.classList.remove("active");
    timer = 0;
    clearInterval(timerInterval);
    msgBox.textContent = "";
    msgBox.className = "mine-message";

    grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }))
    );

    renderBoard();
    updateStats();
  }

  startGame();
  return wrap;
}
