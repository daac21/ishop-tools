/* =========================================================
   iShop Tools — v1: estructura y navegación
   La información (precios, cobertura, etc.) se agregará
   después en /datos/*.json. Por ahora cada pantalla es un
   placeholder que confirma que la navegación funciona.
   ========================================================= */

// ---- Definición del menú principal ----
const MENU = [
  { id: "tradein",   icon: "💰", label: "Trade In",       color: "#0071e3" },
  { id: "switchup",  icon: "🔄", label: "Switch Up",      color: "#ff9500" },
  { id: "applecare", icon: "🛡️", label: "AppleCare+",     color: "#34c759" },
  { id: "forlife",   icon: "💳", label: "For Life + AC",  color: "#5856d6" },
  { id: "getac",     icon: "💳", label: "GET + AC",       color: "#af52de" },
  { id: "cubre",     icon: "🛠️", label: "¿Qué cubre?",    color: "#ff3b30" },
  { id: "scanner",   icon: "📷", label: "Escáner",        color: "#1d1d1f" },
  { id: "cajas",     icon: "𝄃𝄃𝄂𝄂𝄀𝄁𝄃𝄂𝄂𝄃", label: "Código cajas",   color: "#8e8e93" },
];

// ---- iShop Arcade (oculto: se abre manteniendo presionado el nombre "iShop Tools") ----
const ARCADE_GAMES = [
  { id: "tetris", icon: "🧱", label: "Tetris",     color: "#0071e3" },
  { id: "snake",  icon: "🐍", label: "Snake",      color: "#34c759" },
  { id: "mines",  icon: "💣", label: "Buscaminas", color: "#3a3a3c" },
];

// Iconos y color por categoría de cobertura
const COVERAGE_ICONS = {
  "iPhone": "📱", "iPad": "📱", "Mac": "🖥️", "Mac Neo": "💻",
  "Apple Watch": "⌚", "AirPods Pro": "🎧", "AirPods Max": "🎧",
  "HomePod": "🔊", "Apple TV": "📺",
};
const COVERAGE_TILE_COLORS = ["#0071e3", "#ff9500", "#34c759", "#5856d6", "#af52de", "#ff3b30", "#1d1d1f", "#0a84ff", "#30d158"];

function coverageYears(category, extra) {
  const t = `${category || ""} ${extra || ""}`.toLowerCase();
  if (t.includes("herm") || t.includes("edition")) return 3;
  if (t.includes("mac") || t.includes("display")) return 3;
  return 2;
}

// Ícono/color por categoría para el apartado AppleCare+ (datos/applecare_info.json)
const AC_CATEGORY_META = {
  "iPhone":    { icon: "📱", color: "#0071e3" },
  "Watch":     { icon: "⌚", color: "#ff3b30" },
  "iPad":      { icon: "📱", color: "#5856d6" },
  "Mac":       { icon: "💻", color: "#34c759" },
  "HomePod":   { icon: "🔊", color: "#ff9500" },
  "Apple TV":  { icon: "📺", color: "#1d1d1f" },
  "AirPods":   { icon: "🎧", color: "#8e8e93" },
};

let TRADEIN_DATA = null;
let PRECIOS_IPHONE = null;
let APPLECARE_DATA = null;
let SWITCHUP_MODELOS = null;
let FINANCIAMIENTO_DATA = null;
let COBERTURA_DATA = null;
let APPLECARE_INFO = null;
let ESCANER_DATA = null;
let CODIGOS_CAJAS = null;

async function loadAllData() {
  try {
    const [t, p, a, s, f, c, aci, esc, caj] = await Promise.all([
      fetch("datos/tradein.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/precios_iphone.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/applecare.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/switchup_modelos.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/financiamiento.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/cobertura.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/applecare_info.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/escaner.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/codigos_cajas.json", { cache: "no-store" }).then(r => r.json()),
    ]);
    TRADEIN_DATA = t;
    PRECIOS_IPHONE = p;
    APPLECARE_DATA = a;
    SWITCHUP_MODELOS = s;
    FINANCIAMIENTO_DATA = f;
    COBERTURA_DATA = c;
    APPLECARE_INFO = aci;
    ESCANER_DATA = esc;
    CODIGOS_CAJAS = caj;
    localStorage.setItem("ishop_data_cache", JSON.stringify({ tradein: t, precios_iphone: p, applecare: a, switchup_modelos: s, financiamiento: f, cobertura: c, applecare_info: aci, escaner: esc, codigos_cajas: caj }));
  } catch (e) {
    const cached = localStorage.getItem("ishop_data_cache");
    if (cached) {
      const data = JSON.parse(cached);
      TRADEIN_DATA = data.tradein || {};
      PRECIOS_IPHONE = data.precios_iphone || {};
      APPLECARE_DATA = data.applecare || {};
      SWITCHUP_MODELOS = data.switchup_modelos || [];
      FINANCIAMIENTO_DATA = data.financiamiento || {};
      COBERTURA_DATA = data.cobertura || {};
      APPLECARE_INFO = data.applecare_info || {};
      ESCANER_DATA = data.escaner || {};
      CODIGOS_CAJAS = data.codigos_cajas || {};
    } else {
      TRADEIN_DATA = {};
      PRECIOS_IPHONE = {};
      APPLECARE_DATA = {};
      SWITCHUP_MODELOS = [];
      FINANCIAMIENTO_DATA = {};
      COBERTURA_DATA = {};
      APPLECARE_INFO = {};
      ESCANER_DATA = {};
      CODIGOS_CAJAS = {};
    }
  }
}
const dataReady = loadAllData();

let stack = [{ screen: "home", title: "iShop Tools" }];
const MESES = [3, 6, 9, 10, 12, 13, 15];
const MEMBRESIA_SWITCH = 399;

function money(n) {
  if (n === null || n === undefined || isNaN(n)) return "Precio pendiente";
  return "$" + Math.round(n).toLocaleString("es-MX");
}

function parsePesoValue(str) {
  if (typeof str !== "string") return null;
  const clean = str.replace(/[^0-9.]/g, "");
  if (!clean) return null;
  return parseFloat(clean);
}

function computePlan(base, extra, months, acMonths) {
  if (base === null || base === undefined) return null;
  const safeExtra = extra || 0;
  if (months === 15 && safeExtra > 0) {
    const acM = acMonths || 10;
    return {
      split: true,
      acMonths: acM,
      phase1: { months: acM, amount: base / 15 + safeExtra / acM },
      phase2: { months: 15 - acM, amount: base / 15 },
    };
  }
  return { split: false, amount: (base + safeExtra) / months };
}

const screensEl = document.getElementById("screens");
const titleEl = document.getElementById("screenTitle");
const backBtn = document.getElementById("backBtn");
const homeBtn = document.getElementById("homeBtn");

function currentEntry() {
  return stack[stack.length - 1];
}

function navigate(entry) {
  stack.push(entry);
  render(true);
}

function goBack() {
  if (stack.length > 1) {
    stack.pop();
    render(false);
  }
}

function goHome() {
  stack = [{ screen: "home", title: "iShop Tools" }];
  render(false);
}

backBtn.addEventListener("click", goBack);
homeBtn.addEventListener("click", goHome);

/* ---- Deslizar con el dedo hacia la derecha para regresar (como el gesto de iOS) ---- */
(function setupSwipeBack() {
  const EDGE_ZONE = 35;   // solo cuenta si el toque inicia cerca del borde izquierdo
  const THRESHOLD = 70;   // distancia mínima para considerarlo un swipe
  let startX = 0, startY = 0, tracking = false;

  screensEl.addEventListener("touchstart", (e) => {
    if (stack.length <= 1) { tracking = false; return; }
    const t = e.touches[0];
    if (t.clientX > EDGE_ZONE) { tracking = false; return; }
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  }, { passive: true });

  screensEl.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = Math.abs(t.clientY - startY);
    if (dx > THRESHOLD && dy < 60) goBack();
  }, { passive: true });
})();

function render(isForward) {
  const entry = currentEntry();
  if (entry.screen !== "scanner") stopScanner();
  titleEl.textContent = entry.title;
  backBtn.hidden = stack.length === 1;
  homeBtn.hidden = stack.length === 1;

  const node = buildScreen(entry);
  node.classList.add("screen");
  if (isForward) node.classList.add("enter");
  screensEl.innerHTML = "";
  screensEl.appendChild(node);
}

function buildScreen(entry) {
  const el = document.createElement("div");

  if (entry.screen === "home") {
    el.appendChild(buildHome());
  } else if (entry.screen === "coverage") {
    el.appendChild(buildCoverageList());
  } else if (entry.screen === "coverageVariant") {
    el.appendChild(buildCoverageVariantList(entry.category));
  } else if (entry.screen === "coverageDetail") {
    el.appendChild(buildCoverageDetail(entry.category, entry.variant));
  } else if (entry.screen === "tradeNode") {
    el.appendChild(buildTradeNode(entry.path));
  } else if (entry.screen === "quoteSelectNew") {
    el.appendChild(buildQuoteSelectNew(entry.path, entry.tradeIn));
  } else if (entry.screen === "quoteResult") {
    el.appendChild(buildQuoteResult(entry.tradeIn, entry.newModel, entry.newCapacity));
  } else if (entry.screen === "switchSelect") {
    el.appendChild(buildSwitchSelect(entry.path));
  } else if (entry.screen === "switchResult") {
    el.appendChild(buildSwitchResult(entry.newModel, entry.newCapacity));
  } else if (entry.screen === "financeSelect") {
    el.appendChild(buildFinanceSelect(entry.path, entry.planType));
  } else if (entry.screen === "financeResult") {
    el.appendChild(buildFinanceResult(entry.model, entry.capacity, entry.planType));
  } else if (entry.screen === "acCategories") {
    el.appendChild(buildAcCategories());
  } else if (entry.screen === "acModels") {
    el.appendChild(buildAcModels(entry.category));
  } else if (entry.screen === "acVariants") {
    el.appendChild(buildAcVariants(entry.category, entry.model));
  } else if (entry.screen === "acDetail") {
    el.appendChild(buildAcDetail(entry.category, entry.model, entry.variant));
  } else if (entry.screen === "scanner") {
    el.appendChild(buildScanner());
  } else if (entry.screen === "cajasCategories") {
    el.appendChild(buildCajasCategories());
  } else if (entry.screen === "cajasModels") {
    el.appendChild(buildCajasModels(entry.category));
  } else if (entry.screen === "cajasDetail") {
    el.appendChild(buildCajasDetail(entry.category, entry.modelo));
  } else if (entry.screen === "arcade") {
    el.appendChild(buildArcade());
  } else if (entry.screen === "minesweeper") {
    el.appendChild(buildMinesweeper());
  } else if (entry.screen === "tetris") {
    el.appendChild(buildTetris());
  } else if (entry.screen === "snake") {
    el.appendChild(buildSnake());
  } else if (entry.screen === "tool") {
    const meta = MENU.find(m => m.id === entry.id);
    el.appendChild(buildPlaceholder(entry.title, meta ? meta.icon : "🔧",
      "Esta sección se conectará próximamente a datos/" + entry.id + ".json."));
  }

  return el;
}

function buildHome() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "home-heading";
  heading.innerHTML = `
    <div class="home-heading-row">
      <div>
        <h2 id="ishopArcadeTrigger">iShop Tools</h2>
        <p>¿Qué herramienta necesitas?</p>
      </div>
      <div class="view-toggle">
        <button class="view-toggle-btn" data-view="grid" title="Cuadrícula">⊞</button>
        <button class="view-toggle-btn" data-view="list" title="Lista">☰</button>
      </div>
    </div>
  `;
  wrap.appendChild(heading);
  setupArcadeTrigger(heading.querySelector("#ishopArcadeTrigger"));

  const listWrap = document.createElement("div");
  wrap.appendChild(listWrap);

  function renderMenu() {
    const view = localStorage.getItem("ishop_home_view") || "grid";
    heading.querySelectorAll(".view-toggle-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.view === view);
    });

    listWrap.innerHTML = "";

    if (view === "grid") {
      const grid = document.createElement("div");
      grid.className = "coverage-tile-grid";
      MENU.forEach(item => {
        const tile = document.createElement("button");
        tile.className = "coverage-tile";
        tile.style.setProperty("--tile-color", item.color);
        tile.innerHTML = `<span class="coverage-tile-icon">${item.icon}</span><span>${item.label}</span>`;
        tile.addEventListener("click", () => handleMenuClick(item));
        grid.appendChild(tile);
      });
      listWrap.appendChild(grid);
    } else {
      const list = document.createElement("div");
      list.className = "tool-list";
      MENU.forEach(item => {
        const btn = document.createElement("button");
        btn.className = "tool-btn tool-btn-neutral";
        btn.innerHTML = `
          <span class="tool-icon">${item.icon}</span>
          <span class="tool-label">${item.label}</span>
          <span class="chev"></span>
        `;
        btn.addEventListener("click", () => handleMenuClick(item));
        list.appendChild(btn);
      });
      listWrap.appendChild(list);
    }
  }

  async function handleMenuClick(item) {
    if (item.id === "cubre") {
      if (!COBERTURA_DATA) await dataReady;
      navigate({ screen: "coverage", title: item.label });
    } else if (item.id === "tradein") {
      if (!TRADEIN_DATA) await dataReady;
      navigate({ screen: "tradeNode", path: [], title: item.label });
    } else if (item.id === "switchup") {
      if (!PRECIOS_IPHONE) await dataReady;
      navigate({ screen: "switchSelect", path: [], title: item.label });
    } else if (item.id === "applecare") {
      if (!APPLECARE_INFO) await dataReady;
      navigate({ screen: "acCategories", title: item.label });
    } else if (item.id === "forlife" || item.id === "getac") {
      if (!FINANCIAMIENTO_DATA) await dataReady;
      const planType = item.id === "forlife" ? "IFL" : "GET";
      navigate({ screen: "financeSelect", path: [], planType, title: item.label });
    } else if (item.id === "scanner") {
      if (!ESCANER_DATA) await dataReady;
      navigate({ screen: "scanner", title: item.label });
    } else if (item.id === "cajas") {
      if (!CODIGOS_CAJAS) await dataReady;
      navigate({ screen: "cajasCategories", title: item.label });
    } else {
      navigate({ screen: "tool", id: item.id, title: item.label });
    }
  }

  heading.querySelectorAll(".view-toggle-btn").forEach(b => {
    b.addEventListener("click", () => {
      localStorage.setItem("ishop_home_view", b.dataset.view);
      renderMenu();
    });
  });

  renderMenu();
  return wrap;
}

/* ---- Gesto secreto: mantener presionado "iShop Tools" abre iShop Arcade ---- */
function setupArcadeTrigger(titleEl2) {
  if (!titleEl2) return;
  const HOLD_MS = 800;
  let pressTimer = null;

  const start = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    titleEl2.classList.add("title-pressing");
    pressTimer = setTimeout(() => {
      titleEl2.classList.remove("title-pressing");
      if (navigator.vibrate) navigator.vibrate(15);
      navigate({ screen: "arcade", title: "iShop Arcade" });
    }, HOLD_MS);
  };
  const cancel = () => {
    clearTimeout(pressTimer);
    titleEl2.classList.remove("title-pressing");
  };

  titleEl2.addEventListener("pointerdown", start);
  titleEl2.addEventListener("pointerup", cancel);
  titleEl2.addEventListener("pointerleave", cancel);
  titleEl2.addEventListener("pointercancel", cancel);
  titleEl2.addEventListener("contextmenu", (e) => e.preventDefault());
}

/* ---- iShop Arcade: menú de juegos ---- */
function buildArcade() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>🕹️ iShop Arcade</h2><p>Encontraste el modo secreto. Elige un juego.</p>`;
  wrap.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "coverage-tile-grid";
  ARCADE_GAMES.forEach(item => {
    const tile = document.createElement("button");
    tile.className = "coverage-tile";
    tile.style.setProperty("--tile-color", item.color);
    tile.innerHTML = `<span class="coverage-tile-icon">${item.icon}</span><span>${item.label}</span>`;
    tile.addEventListener("click", () => {
      if (item.id === "mines") {
        navigate({ screen: "minesweeper", title: item.label });
      } else {
        navigate({ screen: item.id, title: item.label });
      }
    });
    grid.appendChild(tile);
  });
  wrap.appendChild(grid);

  return wrap;
}

function buildCoverageList() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>¿Qué cubre?</h2>`;
  wrap.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "coverage-tile-grid";

  const categories = COBERTURA_DATA ? Object.keys(COBERTURA_DATA) : [];
  if (categories.length === 0) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🛠️", "Aún no hay información cargada en datos/cobertura.json."));
    return wrap;
  }

  categories.forEach((cat, i) => {
    const tile = document.createElement("button");
    tile.className = "coverage-tile";
    tile.style.setProperty("--tile-color", COVERAGE_TILE_COLORS[i % COVERAGE_TILE_COLORS.length]);
    tile.innerHTML = `<span class="coverage-tile-icon">${COVERAGE_ICONS[cat] || "🛠️"}</span><span>${cat}</span>`;
    tile.addEventListener("click", () => {
      const variants = Object.keys(COBERTURA_DATA[cat]);
      if (variants.length === 1) {
        navigate({ screen: "coverageDetail", category: cat, variant: variants[0], title: cat });
      } else {
        navigate({ screen: "coverageVariant", category: cat, title: cat });
      }
    });
    grid.appendChild(tile);
  });

  wrap.appendChild(grid);
  return wrap;
}

function buildCoverageVariantList(category) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${COVERAGE_ICONS[category] || "🛠️"} ${category}</h2>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(COBERTURA_DATA[category]).forEach(variant => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${variant}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "coverageDetail", category, variant, title: variant });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function buildCoverageDetail(category, variant) {
  const wrap = document.createElement("div");
  const data = COBERTURA_DATA?.[category]?.[variant];
  const isRobo = /robo/i.test(variant);

  const hero = document.createElement("div");
  hero.className = "coverage-hero" + (isRobo ? " robo" : "");
  hero.innerHTML = `
    <span class="coverage-hero-icon">${COVERAGE_ICONS[category] || "🛠️"}</span>
    <span class="coverage-hero-cat">${category}</span>
    <strong>${variant}</strong>
    <span class="coverage-years">🗓️ ${coverageYears(category, variant)} años de cobertura</span>
  `;
  wrap.appendChild(hero);

  if (!data) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🛠️", "Aún no hay información cargada para esta cobertura."));
    return wrap;
  }

  function section(title, icon, innerNode) {
    const sec = document.createElement("div");
    sec.className = "cov-section";
    const h = document.createElement("h3");
    h.innerHTML = `<span>${icon}</span> ${title}`;
    sec.appendChild(h);
    sec.appendChild(innerNode);
    wrap.appendChild(sec);
  }

  function chipList(items, kind) {
    const box = document.createElement("div");
    box.className = "chip-list";
    items.forEach(text => {
      const chip = document.createElement("span");
      chip.className = kind === "good" ? "chip-good" : "chip-bad";
      chip.textContent = (kind === "good" ? "✓ " : "✕ ") + text;
      box.appendChild(chip);
    });
    return box;
  }

  if (data.cubre?.length) section("Qué cubre", "✅", chipList(data.cubre, "good"));
  if (data.no_cubre?.length) section("Qué no cubre", "❌", chipList(data.no_cubre, "bad"));

  if (data.cuotas?.length) {
    const box = document.createElement("div");
    box.className = "fee-list";
    data.cuotas.forEach(c => {
      const row = document.createElement("div");
      row.className = "fee-row";
      row.innerHTML = `<span>${c.label}</span><strong>${c.precio}</strong>`;
      box.appendChild(row);
    });
    section("Cuotas de servicio", "💰", box);
  }

  if (data.si_aplica?.length) section("Casos que normalmente sí aplican", "📍", chipList(data.si_aplica, "good"));
  if (data.rechazados?.length) section("Casos que pueden ser rechazados", "🚫", chipList(data.rechazados, "bad"));

  if (data.bateria) {
    const box = document.createElement("div");
    box.className = "battery-box";
    box.innerHTML = `<span>${data.bateria.condicion}</span><strong>${data.bateria.resultado}</strong>`;
    section("Batería", "🔋", box);
  }

  if (data.info?.length) {
    const ul = document.createElement("ul");
    ul.className = "info-checklist";
    data.info.forEach(t => { const li = document.createElement("li"); li.textContent = "✓ " + t; ul.appendChild(li); });
    section("Información importante", "🔄", ul);
  }

  if (data.reclamo?.length) {
    const ol = document.createElement("ol");
    ol.className = "claim-steps";
    data.reclamo.forEach(t => { const li = document.createElement("li"); li.textContent = t; ol.appendChild(li); });
    section("Cómo reclamar", "📋", ol);
  }

  return wrap;
}

function buildPlaceholder(title, emoji, message) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="placeholder-card">
      <span class="emoji">${emoji}</span>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
  return wrap;
}

/* ---- Escáner de código de barras (lee con la cámara y busca en datos/escaner.json) ---- */
let scannerLibPromise = null;
let html5QrcodeInstance = null;

function loadScannerLib() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (scannerLibPromise) return scannerLibPromise;
  scannerLibPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar la librería del escáner."));
    document.head.appendChild(script);
  });
  return scannerLibPromise;
}

function stopScanner() {
  if (html5QrcodeInstance) {
    const inst = html5QrcodeInstance;
    html5QrcodeInstance = null;
    inst.stop().then(() => inst.clear()).catch(() => {});
  }
}

function buildScanner() {
  const wrap = document.createElement("div");
  wrap.className = "scanner-wrap";

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>📷 Escáner</h2><p>Apunta la cámara al código de barras de la caja.</p>`;
  wrap.appendChild(heading);

  const readerBox = document.createElement("div");
  readerBox.id = "scanner-reader";
  readerBox.className = "scanner-reader";
  wrap.appendChild(readerBox);

  const statusEl = document.createElement("p");
  statusEl.className = "scanner-status";
  statusEl.textContent = "Cargando cámara…";
  wrap.appendChild(statusEl);

  const resultBox = document.createElement("div");
  resultBox.className = "scanner-result";
  wrap.appendChild(resultBox);

  const manualRow = document.createElement("div");
  manualRow.className = "scanner-manual";
  manualRow.innerHTML = `
    <input type="text" inputmode="numeric" placeholder="O escribe el código aquí" class="scanner-manual-input">
    <button class="scanner-manual-btn">Buscar</button>
  `;
  wrap.appendChild(manualRow);

  function showResult(code) {
    const info = ESCANER_DATA ? ESCANER_DATA[code] : null;
    if (!info) {
      resultBox.innerHTML = `
        <div class="placeholder-card">
          <span class="emoji">❓</span>
          <h3>Código no encontrado</h3>
          <p>${code}</p>
        </div>
      `;
      return;
    }
    resultBox.innerHTML = `
      <div class="trade-banner"><span>${code}</span><strong>${info.modelo}</strong></div>
      <div class="finance-col">
        <div class="finance-row"><span>Color</span><strong>${info.color}</strong></div>
        <div class="finance-row"><span>Capacidad</span><strong>${info.capacidad} GB</strong></div>
        <div class="finance-row"><span>AppleCare+</span><strong>${money(info.applecare)}</strong></div>
        <div class="finance-row total"><span>AppleCare+ R y P</span><strong>${money(info.applecare_robo_perdida)}</strong></div>
      </div>
    `;
  }

  const manualInput = manualRow.querySelector(".scanner-manual-input");
  const manualBtn = manualRow.querySelector(".scanner-manual-btn");
  manualBtn.addEventListener("click", () => {
    const val = manualInput.value.trim();
    if (val) showResult(val);
  });
  manualInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") manualBtn.click();
  });

  loadScannerLib().then(() => {
    statusEl.textContent = "";
    const instance = new Html5Qrcode("scanner-reader", {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
      verbose: false,
    });
    html5QrcodeInstance = instance;

    let lastCode = null;
    let lastTime = 0;

    instance.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 160 } },
      (decodedText) => {
        const now = Date.now();
        if (decodedText === lastCode && now - lastTime < 2500) return;
        lastCode = decodedText;
        lastTime = now;
        if (navigator.vibrate) navigator.vibrate(80);
        showResult(decodedText);
      },
      () => {} // errores de lectura cuadro a cuadro: se ignoran, son normales
    ).catch(() => {
      statusEl.textContent = "No se pudo abrir la cámara. Revisa los permisos o usa la búsqueda manual de abajo.";
    });
  }).catch(() => {
    statusEl.textContent = "No se pudo cargar el escáner (revisa tu conexión). Usa la búsqueda manual de abajo.";
  });

  return wrap;
}

/* ---- Código cajas: generar el código de barras de AppleCare+ (y el de serie) para escanear en caja ---- */
const CAJAS_CATEGORY_META = {
  "iPhone (T&L)": { icon: "📱" },
  "iPhone": { icon: "📱" },
  "Watch": { icon: "⌚" },
  "iPad": { icon: "📱" },
  "Mac": { icon: "💻" },
  "Studio Display": { icon: "🖥️" },
  "AirPods": { icon: "🎧" },
  "Home / TV": { icon: "🏠" },
};

let barcodeLibPromise = null;
function loadBarcodeLib() {
  if (window.JsBarcode) return Promise.resolve();
  if (barcodeLibPromise) return barcodeLibPromise;
  barcodeLibPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el generador de códigos."));
    document.head.appendChild(script);
  });
  return barcodeLibPromise;
}

function renderBarcodeInto(container, value, format) {
  container.innerHTML = `<svg class="barcode-svg"></svg>`;
  const svg = container.querySelector("svg");
  loadBarcodeLib().then(() => {
    try {
      window.JsBarcode(svg, value, {
        format: format || "CODE39",
        lineColor: "#000",
        background: "transparent",
        width: 2.4,
        height: 90,
        displayValue: true,
        fontSize: 16,
        margin: 8,
      });
    } catch (e) {
      container.innerHTML = `<p class="pending">No se pudo generar este código.</p>`;
    }
  }).catch(() => {
    container.innerHTML = `<p class="pending">Sin conexión: no se pudo cargar el generador de códigos.</p>`;
  });
}

function buildCajasCategories() {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>📦 Código cajas</h2><p>Elige el equipo para generar su código de AppleCare+.</p>`;
  wrap.appendChild(heading);

  const cats = CODIGOS_CAJAS ? Object.keys(CODIGOS_CAJAS) : [];
  if (cats.length === 0) {
    wrap.appendChild(buildPlaceholder("Sin datos", "📦", "Aún no hay códigos cargados."));
    return wrap;
  }

  const grid = document.createElement("div");
  grid.className = "coverage-tile-grid";
  cats.forEach((cat, i) => {
    const meta = CAJAS_CATEGORY_META[cat] || { icon: "📦" };
    const tile = document.createElement("button");
    tile.className = "coverage-tile";
    tile.style.setProperty("--tile-color", COVERAGE_TILE_COLORS[i % COVERAGE_TILE_COLORS.length]);
    tile.innerHTML = `<span class="coverage-tile-icon">${meta.icon}</span><span>${cat}</span>`;
    tile.addEventListener("click", () => {
      navigate({ screen: "cajasModels", category: cat, title: cat });
    });
    grid.appendChild(tile);
  });
  wrap.appendChild(grid);
  return wrap;
}

function buildCajasModels(category) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${category}</h2>`;
  wrap.appendChild(heading);

  const models = (CODIGOS_CAJAS && CODIGOS_CAJAS[category]) || [];
  const list = document.createElement("div");
  list.className = "sub-list";
  models.forEach(m => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${m.modelo}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "cajasDetail", category, modelo: m.modelo, title: m.modelo });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function buildCajasDetail(category, modelo) {
  const wrap = document.createElement("div");
  const models = (CODIGOS_CAJAS && CODIGOS_CAJAS[category]) || [];
  const info = models.find(m => m.modelo === modelo);

  if (!info) {
    wrap.appendChild(buildPlaceholder("Sin datos", "📦", "No se encontró este equipo."));
    return wrap;
  }

  const hero = document.createElement("div");
  hero.className = "ac-hero";
  hero.innerHTML = `
    <span class="ac-hero-icon">📦</span>
    <h2>${info.modelo}</h2>
    <div class="ac-price">${money(info.precio)}</div>
  `;
  wrap.appendChild(hero);

  const chipsRow = document.createElement("div");
  chipsRow.className = "chip-list";
  ["Externo", "Interno"].forEach((label, i) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (i === 0 ? " active" : "");
    chip.textContent = label;
    chip.addEventListener("click", () => {
      chipsRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      showAcBarcode(label);
    });
    chipsRow.appendChild(chip);
  });
  wrap.appendChild(chipsRow);

  const acBarcodeBox = document.createElement("div");
  acBarcodeBox.className = "barcode-box";
  wrap.appendChild(acBarcodeBox);

  function showAcBarcode(label) {
    const value = label === "Externo" ? info.externo : info.interno;
    renderBarcodeInto(acBarcodeBox, value, "CODE39");
  }
  showAcBarcode("Externo");

  const serialToggleRow = document.createElement("div");
  serialToggleRow.className = "scanner-manual";
  serialToggleRow.style.marginTop = "20px";
  serialToggleRow.innerHTML = `
    <input type="text" placeholder="Número de serie del equipo (opcional)" class="scanner-manual-input serial-input">
    <button class="scanner-manual-btn">Generar</button>
  `;
  wrap.appendChild(serialToggleRow);

  const serialBarcodeBox = document.createElement("div");
  serialBarcodeBox.className = "barcode-box";
  serialBarcodeBox.hidden = true;
  wrap.appendChild(serialBarcodeBox);

  const serialInput = serialToggleRow.querySelector(".serial-input");
  const serialBtn = serialToggleRow.querySelector(".scanner-manual-btn");
  function generateSerial() {
    const val = serialInput.value.trim().toUpperCase();
    if (!val) return;
    serialBarcodeBox.hidden = false;
    renderBarcodeInto(serialBarcodeBox, val, "CODE39");
  }
  serialBtn.addEventListener("click", generateSerial);
  serialInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") generateSerial();
  });

  return wrap;
}

const PRICE_ROWS = [
  { key: "ÓPTIMO",   label: "Óptimo",   color: "#34c759" },
  { key: "BATERÍA",  label: "Batería",  color: "#ff9500" },
  { key: "PANTALLA", label: "Pantalla", color: "#0071e3" },
  { key: "B Y P",    label: "B y P",    color: "#af52de" },
];

function getNodeAtPath(path) {
  let node = TRADEIN_DATA;
  for (const key of path) {
    if (!node) return null;
    node = node[key];
  }
  return node;
}

function isPriceLeaf(node) {
  return node && typeof node === "object" && Object.prototype.hasOwnProperty.call(node, "ÓPTIMO");
}

function buildTradeNode(path) {
  const node = getNodeAtPath(path);
  const wrap = document.createElement("div");

  if (!node) {
    wrap.appendChild(buildPlaceholder("Trade In", "🛒", "No se encontró información para esta selección."));
    return wrap;
  }

  if (isPriceLeaf(node)) {
    const isIphone = path[0] === "iPhone";
    const heading = document.createElement("div");
    heading.className = "section-heading";
    heading.innerHTML = `<h2>${path[path.length - 1]}</h2>`;
    wrap.appendChild(heading);

    const list = document.createElement("div");
    list.className = "sub-list";

    PRICE_ROWS.forEach(row => {
      const raw = node[row.key] ?? "N/A";
      const numeric = parsePesoValue(raw);
      const item = document.createElement(isIphone && numeric !== null ? "button" : "div");
      item.className = "sub-btn";
      item.innerHTML = `
        <span style="display:flex;align-items:center;gap:10px;">
          <span style="width:9px;height:9px;border-radius:50%;background:${row.color};display:inline-block;"></span>
          ${row.label}
        </span>
        <span style="font-weight:650;">${raw}</span>
      `;
      if (isIphone && numeric !== null) {
        item.addEventListener("click", () => {
          navigate({
            screen: "quoteSelectNew",
            path: [],
            tradeIn: { model: path[1], capacity: path[2], value: numeric, condition: row.label },
            title: "Equipo nuevo",
          });
        });
      }
      list.appendChild(item);
    });
    wrap.appendChild(list);
    return wrap;
  }

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const label = path.length === 0 ? "Trade In" : path[path.length - 1];
  heading.innerHTML = `<h2>${path.length === 0 ? "Selecciona un tipo" : label}</h2>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(node).forEach(key => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${key}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "tradeNode", path: [...path, key], title: key });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function buildQuoteSelectNew(path, tradeIn) {
  const node = getNodeAtPathIn(PRECIOS_IPHONE, path);
  const wrap = document.createElement("div");

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  banner.innerHTML = `<span>Trade In seleccionado</span><strong>${tradeIn.model} ${tradeIn.capacity} · ${tradeIn.condition} · ${money(tradeIn.value)}</strong>`;
  wrap.appendChild(banner);

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${path.length === 0 ? "Elige el iPhone nuevo" : path[path.length - 1]}</h2>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";

  if (typeof node !== "object" || node === null) {
    wrap.appendChild(buildPlaceholder("Sin datos", "📦", "Aún no hay precios cargados para esta selección."));
    return wrap;
  }

  const isLeaf = Object.values(node).every(v => v === null || typeof v === "number");
  if (isLeaf) {
    Object.entries(node).forEach(([cap, price]) => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${cap}</span><span style="font-weight:650;">${money(price)}</span>`;
      btn.addEventListener("click", () => {
        navigate({
          screen: "quoteResult",
          tradeIn,
          newModel: path[path.length - 1],
          newCapacity: cap,
          title: "Cotización",
        });
      });
      list.appendChild(btn);
    });
  } else {
    filteredModelKeys(node, path).forEach(key => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${key}</span><span class="chev"></span>`;
      btn.addEventListener("click", () => {
        navigate({ screen: "quoteSelectNew", path: [...path, key], tradeIn, title: key });
      });
      list.appendChild(btn);
    });
  }
  wrap.appendChild(list);
  return wrap;
}

function getNodeAtPathIn(root, path) {
  let node = root;
  for (const key of path) {
    if (!node) return null;
    node = node[key];
  }
  return node;
}

function filteredModelKeys(node, path) {
  if (path.length === 0 && Array.isArray(SWITCHUP_MODELOS)) {
    return SWITCHUP_MODELOS.filter(m => Object.prototype.hasOwnProperty.call(node, m));
  }
  return Object.keys(node);
}

function buildQuoteResult(tradeIn, newModel, newCapacity) {
  const wrap = document.createElement("div");
  const newPrice = PRECIOS_IPHONE?.[newModel]?.[newCapacity] ?? null;
  const ac = APPLECARE_DATA?.[newModel] || {};
  const base = newPrice === null ? null : newPrice - tradeIn.value;

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  wrap.appendChild(banner);

  function updateBanner(opt) {
    if (newPrice === null) {
      banner.innerHTML = `<span>${newModel} ${newCapacity}</span><strong>Precio pendiente de cargar</strong>`;
      return;
    }
    let html = `<span>${newModel} ${newCapacity}</span><strong>${money(newPrice)} − ${money(tradeIn.value)} (Trade In) = ${money(base)}`;
    if (opt && opt.extra !== null && opt.extra !== undefined && opt.extra > 0) {
      html += ` + ${money(opt.extra)} ${opt.shortLabel} = ${money(base + opt.extra)}</strong>`;
    } else {
      html += `</strong>`;
    }
    banner.innerHTML = html;
  }

  const options = [
    { key: "solo", label: "Solo equipo", shortLabel: "Equipo", extra: 0 },
    { key: "ac", label: "Equipo + AppleCare+", shortLabel: "AppleCare+", extra: ac.APPLECARE },
    { key: "acrp", label: "Equipo + AppleCare+ R y P", shortLabel: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
  ];

  wrap.appendChild(buildPlanTabs(options, base, { onSelect: updateBanner }));

  if (newPrice !== null) {
    wrap.appendChild(buildTradeInAltFinancing(tradeIn, newModel, newCapacity, newPrice, ac));
  }

  return wrap;
}

function buildTradeInAltFinancing(tradeIn, newModel, newCapacity, newPrice, ac) {
  const wrap = document.createElement("div");
  wrap.style.marginTop = "18px";

  const label = document.createElement("p");
  label.className = "plan-note";
  label.style.margin = "0 0 8px 2px";
  label.textContent = "¿Prefieres verlo en otra forma de pago?";
  wrap.appendChild(label);

  const select = document.createElement("select");
  select.className = "alt-finance-select";
  select.innerHTML = `
    <option value="">Elegir…</option>
    <option value="IFL">iPhone For Life + AC</option>
    <option value="GET">GET + AC</option>
    <option value="switchup">Switch Up</option>
  `;
  wrap.appendChild(select);

  const resultArea = document.createElement("div");
  resultArea.style.marginTop = "12px";
  wrap.appendChild(resultArea);

  select.addEventListener("change", () => {
    resultArea.innerHTML = "";
    if (!select.value) return;

    if (select.value === "switchup") {
      const switchBase = newPrice + MEMBRESIA_SWITCH - tradeIn.value;
      const banner = document.createElement("div");
      banner.className = "trade-banner";
      banner.innerHTML = `<span>Switch Up con Trade In</span><strong>${money(newPrice)} + ${money(MEMBRESIA_SWITCH)} − ${money(tradeIn.value)} (Trade In) = ${money(switchBase)}</strong>`;
      resultArea.appendChild(banner);

      const options = [
        { key: "ac", label: "AppleCare+", extra: ac.APPLECARE },
        { key: "acrp", label: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
      ];
      resultArea.appendChild(buildPlanTabs(options, switchBase));
      return;
    }

    const cfg = FINANCE_CONFIG[select.value];
    const finData = FINANCIAMIENTO_DATA?.[newModel]?.[newCapacity]?.[select.value];
    if (!finData) {
      resultArea.appendChild(buildPlaceholder("Sin datos", "💳", "Aún no hay plan " + cfg.label + " cargado para este equipo."));
      return;
    }

    const totalMsi = cfg.phase1 + cfg.phase2Months;
    const descuentoMensual = tradeIn.value / totalMsi;
    const discountedFinData = {
      monthly: Math.max(0, finData.monthly - descuentoMensual),
      residual: finData.residual,
    };

    const banner = document.createElement("div");
    banner.className = "trade-banner";
    banner.innerHTML = `<span>${cfg.label} con Trade In</span><strong>${money(finData.monthly)}/mes − ${money(descuentoMensual)} (Trade In ÷ ${totalMsi} msi) = ${money(discountedFinData.monthly)}/mes</strong>`;
    resultArea.appendChild(banner);

    resultArea.appendChild(buildFinanceColumnsGrid(discountedFinData, ac, cfg));
  });

  return wrap;
}

function buildSwitchSelect(path) {
  const node = getNodeAtPathIn(PRECIOS_IPHONE, path);
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${path.length === 0 ? "Elige el iPhone nuevo" : path[path.length - 1]}</h2>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";

  if (typeof node !== "object" || node === null) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🔄", "Aún no hay precios cargados para esta selección."));
    return wrap;
  }

  const isLeaf = Object.values(node).every(v => v === null || typeof v === "number");
  if (isLeaf) {
    Object.entries(node).forEach(([cap, price]) => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${cap}</span><span style="font-weight:650;">${money(price)}</span>`;
      btn.addEventListener("click", () => {
        navigate({ screen: "switchResult", newModel: path[path.length - 1], newCapacity: cap, title: "Switch Up" });
      });
      list.appendChild(btn);
    });
  } else {
    filteredModelKeys(node, path).forEach(key => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${key}</span><span class="chev"></span>`;
      btn.addEventListener("click", () => {
        navigate({ screen: "switchSelect", path: [...path, key], title: key });
      });
      list.appendChild(btn);
    });
  }
  wrap.appendChild(list);
  return wrap;
}

function buildSwitchResult(newModel, newCapacity) {
  const wrap = document.createElement("div");
  const newPrice = PRECIOS_IPHONE?.[newModel]?.[newCapacity] ?? null;
  const ac = APPLECARE_DATA?.[newModel] || {};
  const base = newPrice === null ? null : newPrice + MEMBRESIA_SWITCH;

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  wrap.appendChild(banner);

  function updateBanner(opt) {
    if (newPrice === null) {
      banner.innerHTML = `<span>${newModel} ${newCapacity}</span><strong>Precio pendiente de cargar</strong>`;
      return;
    }
    let html = `<span>${newModel} ${newCapacity}</span><strong>${money(newPrice)} + ${money(MEMBRESIA_SWITCH)} membresía`;
    if (opt && opt.extra !== null && opt.extra !== undefined) {
      html += ` + ${money(opt.extra)} ${opt.label} = ${money(base + opt.extra)}</strong>`;
    } else {
      html += ` = ${money(base)}</strong>`;
    }
    banner.innerHTML = html;
  }

  const options = [
    { key: "ac", label: "AppleCare+", extra: ac.APPLECARE },
    { key: "acrp", label: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
  ];

  wrap.appendChild(buildPlanTabs(options, base, { onSelect: updateBanner, phonePrice: newPrice }));
  return wrap;
}

function buildAcCategories() {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "home-heading";
  heading.innerHTML = `<h2>AppleCare+</h2><p>Protección oficial Apple para cada equipo.</p>`;
  wrap.appendChild(heading);

  const cats = APPLECARE_INFO ? Object.keys(APPLECARE_INFO) : [];
  if (cats.length === 0) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🛡️", "Aún no hay información de AppleCare+ cargada."));
    return wrap;
  }

  const list = document.createElement("div");
  list.className = "tool-list";
  cats.forEach(cat => {
    const meta = AC_CATEGORY_META[cat] || { icon: "🛡️", color: "#0071e3" };
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.style.setProperty("--tool-color", meta.color);
    btn.innerHTML = `<span class="tool-icon">${meta.icon}</span><span class="tool-label">${cat}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "acModels", category: cat, title: cat });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function buildAcModels(category) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${category}</h2>`;
  wrap.appendChild(heading);

  const models = APPLECARE_INFO?.[category] || {};
  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(models).forEach(model => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${model}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      const variants = Object.keys(models[model]);
      if (variants.length === 1) {
        navigate({ screen: "acDetail", category, model, variant: variants[0], title: model });
      } else {
        navigate({ screen: "acVariants", category, model, title: model });
      }
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function buildAcVariants(category, model) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>${model}</h2>`;
  wrap.appendChild(heading);

  const variants = APPLECARE_INFO?.[category]?.[model] || {};
  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(variants).forEach(v => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${v}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "acDetail", category, model, variant: v, title: v });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function benefitIcon(text) {
  const t = text.toLowerCase();
  if (t.includes("batería")) return "🔋";
  if (t.includes("robo") || t.includes("extrav")) return "🛡️";
  if (t.includes("soporte")) return "🎧";
  if (t.includes("pencil") || t.includes("keyboard")) return "✏️";
  if (t.includes("original")) return "🔧";
  if (t.includes("accidental")) return "💥";
  return "✅";
}

function buildAcDetail(category, model, variant) {
  const wrap = document.createElement("div");
  const info = APPLECARE_INFO?.[category]?.[model]?.[variant];

  if (!info) {
    wrap.appendChild(buildPlaceholder("Sin datos", "🛡️", "Aún no hay información cargada para este equipo."));
    return wrap;
  }

  const roboPrice = info["Robo y Extravío"];
  const hasRobo = roboPrice !== undefined && roboPrice !== null;
  const years = coverageYears(category, model + " " + variant);
  const meta = AC_CATEGORY_META[category] || { color: "#0071e3" };

  const hero = document.createElement("div");
  hero.className = "ac-hero";
  hero.style.setProperty("--tool-color", meta.color);
  hero.innerHTML = `
    <span class="ac-hero-icon">🛡️</span>
    <h2>${model}</h2>
    <p class="ac-hero-sub">${variant}</p>
    <span class="coverage-years">🗓️ ${years} años de cobertura</span>
    ${hasRobo ? `
      <div class="ac-price-row">
        <div class="ac-price-box">
          <span>AppleCare+</span>
          <strong>${money(info.precio)}</strong>
        </div>
        <div class="ac-price-box robo">
          <span class="ac-ribbon">Protección total</span>
          <span>Robo y Extravío</span>
          <strong>${money(roboPrice)}</strong>
        </div>
      </div>
    ` : `<div class="ac-price">${money(info.precio)}</div>`}
  `;
  wrap.appendChild(hero);

  if (Array.isArray(info.cubre) && info.cubre.length) {
    const benefits = document.createElement("div");
    benefits.className = "ac-benefits";
    benefits.innerHTML = `
      <h4>✨ Todo lo que incluye</h4>
      <div class="ac-benefit-grid">
        ${info.cubre.map(c => `
          <div class="ac-benefit-item">
            <span class="ac-benefit-icon">${benefitIcon(c)}</span>
            <span>${c}</span>
          </div>
        `).join("")}
      </div>
    `;
    wrap.appendChild(benefits);
  }

  if (info.deducibles && Object.keys(info.deducibles).length) {
    const deduc = document.createElement("div");
    deduc.className = "plan-result";
    deduc.innerHTML = `<h4 style="margin:0 0 2px;font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;">Deducibles</h4>`
      + Object.entries(info.deducibles).map(([k, v]) => `<div class="plan-phase"><span>${k}</span><strong>${money(v)}</strong></div>`).join("");
    wrap.appendChild(deduc);
  }

  return wrap;
}

function buildPlanTabs(options, base, extraOpts = {}) {
  const { onSelect, phonePrice } = extraOpts;
  const wrap = document.createElement("div");

  const tabs = document.createElement("div");
  tabs.className = "plan-tabs";
  const panels = document.createElement("div");

  let activeIdx = 0;

  function renderPanel(idx) {
    panels.innerHTML = "";
    const opt = options[idx];
    if (typeof onSelect === "function") onSelect(opt);
    const chipsRow = document.createElement("div");
    chipsRow.className = "month-chips";
    let selectedMonths = MESES[0];

    const acChipsRow = document.createElement("div");
    acChipsRow.className = "month-chips";
    acChipsRow.hidden = true;
    let selectedAcMonths = 10;
    [10, 12, 13].forEach(m => {
      const chip = document.createElement("button");
      chip.className = "chip" + (m === selectedAcMonths ? " active" : "");
      chip.textContent = "AC " + m + " msi";
      chip.addEventListener("click", () => {
        selectedAcMonths = m;
        acChipsRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderResult();
      });
      acChipsRow.appendChild(chip);
    });

    const resultBox = document.createElement("div");
    resultBox.className = "plan-result";

    function renderResult() {
      if (base === null || base === undefined) {
        resultBox.innerHTML = `<p class="pending">Precio del equipo pendiente de cargar.</p>`;
        acChipsRow.hidden = true;
        return;
      }
      if (opt.extra === null) {
        resultBox.innerHTML = `<p class="pending">Precio de AppleCare+ pendiente de cargar.</p>`;
        acChipsRow.hidden = true;
        return;
      }
      acChipsRow.hidden = !(selectedMonths === 15 && opt.extra > 0);
      const plan = computePlan(base, opt.extra, selectedMonths, selectedAcMonths);
      if (!plan) {
        resultBox.innerHTML = `<p class="pending">Precio pendiente de cargar.</p>`;
        return;
      }
      if (plan.split) {
        resultBox.innerHTML = `
          <div class="plan-phase"><span>Mes 1 a ${plan.acMonths} (con AppleCare+)</span><strong>${money(plan.phase1.amount)}/mes</strong></div>
          <div class="plan-phase"><span>Mes ${plan.acMonths + 1} a 15 (solo iPhone)</span><strong>${money(plan.phase2.amount)}/mes</strong></div>
        `;
      } else {
        resultBox.innerHTML = `<div class="plan-phase"><span>${selectedMonths} meses</span><strong>${money(plan.amount)}/mes</strong></div>`;
      }
    }

    MESES.forEach(m => {
      const chip = document.createElement("button");
      chip.className = "chip" + (m === selectedMonths ? " active" : "");
      chip.textContent = m + (m === 15 ? "*" : "");
      chip.addEventListener("click", () => {
        selectedMonths = m;
        chipsRow.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderResult();
      });
      chipsRow.appendChild(chip);
    });

    panels.appendChild(chipsRow);
    panels.appendChild(acChipsRow);
    panels.appendChild(resultBox);
    renderResult();

    if (opt.extra) {
      const note = document.createElement("p");
      note.className = "plan-note";
      note.textContent = "* A 15 meses, el AppleCare+ se financia solo dentro de los meses que elijas (10, 12 o 13).";
      panels.appendChild(note);

      if (phonePrice !== undefined && phonePrice !== null) {
        const promoBox = document.createElement("div");
        promoBox.className = "plan-result";
        promoBox.style.marginTop = "10px";
        promoBox.innerHTML = `
          <div class="plan-phase"><span>50% del equipo</span><strong>${money(phonePrice * 0.5)}</strong></div>
          <div class="plan-phase"><span>50% de ${opt.label}</span><strong>${money(opt.extra * 0.5)}</strong></div>
        `;
        panels.appendChild(promoBox);

        const promoNote = document.createElement("p");
        promoNote.className = "plan-note";
        promoNote.textContent = "50% aplicable dentro de los primeros 13 meses.";
        panels.appendChild(promoNote);
      }
    }
  }

  options.forEach((opt, idx) => {
    const tab = document.createElement("button");
    tab.className = "plan-tab" + (idx === 0 ? " active" : "");
    tab.textContent = opt.label;
    tab.addEventListener("click", () => {
      tabs.querySelectorAll(".plan-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeIdx = idx;
      renderPanel(idx);
    });
    tabs.appendChild(tab);
  });

  wrap.appendChild(tabs);
  wrap.appendChild(panels);
  renderPanel(0);
  return wrap;
}

const FINANCE_CONFIG = {
  IFL: { label: "iPhone For Life", phase1: 10, phase2Start: 11, phase2End: 24, phase2Months: 14, residualMonth: 25 },
  GET: { label: "GET",             phase1: 13, phase2Start: 14, phase2End: 20, phase2Months: 7,  residualMonth: 21 },
};

function buildFinanceSelect(path, planType) {
  const wrap = document.createElement("div");
  const heading = document.createElement("div");
  heading.className = "section-heading";

  if (path.length === 0) {
    heading.innerHTML = `<h2>Elige el iPhone</h2>`;
    wrap.appendChild(heading);
    const list = document.createElement("div");
    list.className = "sub-list";
    const models = FINANCIAMIENTO_DATA ? Object.keys(FINANCIAMIENTO_DATA) : [];
    if (models.length === 0) {
      wrap.appendChild(buildPlaceholder("Sin datos", "💳", "Aún no hay planes cargados en datos/financiamiento.json."));
      return wrap;
    }
    models.forEach(model => {
      const btn = document.createElement("button");
      btn.className = "sub-btn";
      btn.innerHTML = `<span>${model}</span><span class="chev"></span>`;
      btn.addEventListener("click", () => {
        navigate({ screen: "financeSelect", path: [model], planType, title: model });
      });
      list.appendChild(btn);
    });
    wrap.appendChild(list);
    return wrap;
  }

  const model = path[0];
  const caps = FINANCIAMIENTO_DATA?.[model] || {};
  heading.innerHTML = `<h2>${model}</h2>`;
  wrap.appendChild(heading);
  const list = document.createElement("div");
  list.className = "sub-list";
  Object.keys(caps).forEach(cap => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${cap}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "financeResult", model, capacity: cap, planType, title: cap });
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

function buildFinanceResult(model, capacity, planType) {
  const wrap = document.createElement("div");
  const cfg = FINANCE_CONFIG[planType];
  const finData = FINANCIAMIENTO_DATA?.[model]?.[capacity]?.[planType];
  const ac = APPLECARE_DATA?.[model] || {};

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  banner.innerHTML = `<span>${cfg.label}</span><strong>${model} ${capacity}</strong>`;
  wrap.appendChild(banner);

  if (!finData) {
    wrap.appendChild(buildPlaceholder("Sin datos", "💳", "Aún no hay plan " + cfg.label + " cargado para este equipo."));
    return wrap;
  }

  wrap.appendChild(buildFinanceColumnsGrid(finData, ac, cfg));
  return wrap;
}

function buildFinanceColumnsGrid(finData, ac, cfg) {
  const cols = [
    { label: "AppleCare+", extra: ac.APPLECARE },
    { label: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
  ];

  const grid = document.createElement("div");
  grid.className = "finance-columns";

  cols.forEach(col => {
    const card = document.createElement("div");
    card.className = "finance-col";

    if (col.extra === null || col.extra === undefined) {
      card.innerHTML = `<h4>${col.label}</h4><p class="pending">AppleCare+ pendiente</p>`;
      grid.appendChild(card);
      return;
    }

    const phase1Amount = finData.monthly + col.extra / cfg.phase1;
    const phase2Amount = finData.monthly;
    const residual = finData.residual;
    const total = phase1Amount * cfg.phase1 + phase2Amount * cfg.phase2Months + residual;

    card.innerHTML = `
      <h4>${col.label}</h4>
      <div class="finance-row"><span>Mes 1–${cfg.phase1}</span><strong>${money(phase1Amount)}</strong></div>
      <div class="finance-row"><span>Mes ${cfg.phase1 + 1}–${cfg.phase2End}</span><strong>${money(phase2Amount)}</strong></div>
      <div class="finance-row"><span>Mes ${cfg.residualMonth} (saldo)</span><strong>${money(residual)}</strong></div>
      <div class="finance-row total"><span>Total</span><strong>${money(total)}</strong></div>
    `;
    grid.appendChild(card);
  });

  return grid;
}

render(true);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
