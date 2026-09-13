/* =========================================================
   iShop Tools — v1: estructura y navegación
   La información (precios, cobertura, etc.) se agregará
   después en /datos/*.json. Por ahora cada pantalla es un
   placeholder que confirma que la navegación funciona.
   ========================================================= */

// ---- Definición del menú principal ----
const MENU = [
  { id: "tradein",   icon: "🛒", label: "Trade In",       color: "#0071e3" },
  { id: "switchup",  icon: "🔄", label: "Switch Up",      color: "#ff9500" },
  { id: "applecare", icon: "🛡️", label: "AppleCare+",     color: "#34c759" },
  { id: "forlife",   icon: "💳", label: "For Life + AC",  color: "#5856d6" },
  { id: "getac",     icon: "💳", label: "GET + AC",       color: "#af52de" },
  { id: "cubre",     icon: "🛠️", label: "¿Qué cubre?",    color: "#ff3b30" },
  { id: "scanner",   icon: "📷", label: "Escáner",        color: "#1d1d1f" },
  { id: "cajas",     icon: "📦", label: "Código cajas",   color: "#8e8e93" },
];

// Categorías de ejemplo para "¿Qué cubre?" — demuestra navegación
// de más de un nivel (Inicio → ¿Qué cubre? → categoría → detalle)
const COVERAGE_CATEGORIES = [
  { id: "iphone", label: "iPhone" },
  { id: "ipad",   label: "iPad" },
  { id: "mac",    label: "Mac" },
  { id: "watch",  label: "Apple Watch" },
];

// ---- Datos de Trade In / precios / AppleCare+ ----
let TRADEIN_DATA = null;
let PRECIOS_IPHONE = null;
let APPLECARE_DATA = null;
const dataReady = Promise.all([
  fetch("datos/tradein.json").then(r => r.json()).then(d => TRADEIN_DATA = d).catch(() => TRADEIN_DATA = {}),
  fetch("datos/precios_iphone.json").then(r => r.json()).then(d => PRECIOS_IPHONE = d).catch(() => PRECIOS_IPHONE = {}),
  fetch("datos/applecare.json").then(r => r.json()).then(d => APPLECARE_DATA = d).catch(() => APPLECARE_DATA = {}),
]);
const tradeInReady = dataReady; // compat

// ---- Estado de navegación ----
// Cada entrada: { screen: "home" | "tool" | "coverageDetail" | "tradeNode" | "quoteSelectNew" | "quoteResult" | "switchResult", ...params, title }
let stack = [{ screen: "home", title: "iShop Tools" }];
const MESES = [3, 6, 10, 12, 13, 15];
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

// base se reparte en 15 meses siempre; extra (AppleCare) solo en los primeros 10
function computePlan(base, extra, months) {
  if (base === null || base === undefined) return null;
  const safeExtra = extra || 0;
  if (months === 15) {
    return {
      split: safeExtra > 0,
      phase1: { months: 10, amount: base / 15 + safeExtra / 10 },
      phase2: { months: 5, amount: base / 15 },
      single: base / 15 + (safeExtra > 0 ? 0 : 0),
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

// ---- Render principal ----
function render(isForward) {
  const entry = currentEntry();
  titleEl.textContent = entry.title;
  backBtn.hidden = stack.length === 1;
  homeBtn.hidden = stack.length === 1;

  const node = buildScreen(entry);
  node.classList.add("screen");
  if (isForward) node.classList.add("enter");
  screensEl.innerHTML = "";
  screensEl.appendChild(node);
}

// ---- Construcción de cada tipo de pantalla ----
function buildScreen(entry) {
  const el = document.createElement("div");

  if (entry.screen === "home") {
    el.appendChild(buildHome());
  } else if (entry.screen === "coverage") {
    el.appendChild(buildCoverageList());
  } else if (entry.screen === "coverageDetail") {
    el.appendChild(buildPlaceholder(entry.title, "🛠️",
      "Aquí se mostrará la cobertura detallada de " + entry.title + "."));
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
  heading.innerHTML = `<h2>iShop Tools</h2><p>¿Qué herramienta necesitas?</p>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "tool-list";

  MENU.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.style.setProperty("--tool-color", item.color);
    btn.innerHTML = `
      <span class="tool-icon">${item.icon}</span>
      <span class="tool-label">${item.label}</span>
      <span class="chev"></span>
    `;
    btn.addEventListener("click", async () => {
      if (item.id === "cubre") {
        navigate({ screen: "coverage", title: item.label });
      } else if (item.id === "tradein") {
        if (!TRADEIN_DATA) await dataReady;
        navigate({ screen: "tradeNode", path: [], title: item.label });
      } else if (item.id === "switchup") {
        if (!PRECIOS_IPHONE) await dataReady;
        navigate({ screen: "switchSelect", path: [], title: item.label });
      } else {
        navigate({ screen: "tool", id: item.id, title: item.label });
      }
    });
    list.appendChild(btn);
  });

  wrap.appendChild(list);
  return wrap;
}

function buildCoverageList() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  heading.innerHTML = `<h2>Selecciona una categoría</h2>`;
  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";

  COVERAGE_CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "sub-btn";
    btn.innerHTML = `<span>${cat.label}</span><span class="chev"></span>`;
    btn.addEventListener("click", () => {
      navigate({ screen: "coverageDetail", id: cat.id, title: cat.label });
    });
    list.appendChild(btn);
  });

  wrap.appendChild(list);
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

// ---- Trade In: navegación dinámica sobre tradein.json ----
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
    let selectedValue = null;
    let selectedLabel = null;

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
          list.querySelectorAll(".sub-btn").forEach(b => b.classList.remove("selected"));
          item.classList.add("selected");
          selectedValue = numeric;
          selectedLabel = row.label;
          quoteBtn.hidden = false;
          quoteBtn.textContent = `Cotizar con valor de ${row.label} (${money(numeric)})`;
        });
      }
      list.appendChild(item);
    });
    wrap.appendChild(list);

    if (isIphone) {
      const quoteBtn = document.createElement("button");
      quoteBtn.className = "primary-btn";
      quoteBtn.textContent = "Selecciona una condición para cotizar";
      quoteBtn.hidden = true;
      quoteBtn.style.marginTop = "18px";
      quoteBtn.addEventListener("click", () => {
        navigate({
          screen: "quoteSelectNew",
          path: [],
          tradeIn: { model: path[1], capacity: path[2], value: selectedValue, condition: selectedLabel },
          title: "Equipo nuevo",
        });
      });
      wrap.appendChild(quoteBtn);
    }
    return wrap;
  }

  // Nodo intermedio: mostrar lista de opciones (categoría, modelo, capacidad, etc.)
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

// ---- Selección de equipo nuevo (Trade In) ----
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
    Object.keys(node).forEach(key => {
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

// ---- Resultado de cotización Trade In (3 opciones x 6 plazos) ----
function buildQuoteResult(tradeIn, newModel, newCapacity) {
  const wrap = document.createElement("div");
  const newPrice = PRECIOS_IPHONE?.[newModel]?.[newCapacity] ?? null;
  const ac = APPLECARE_DATA?.[newModel] || {};
  const base = newPrice === null ? null : newPrice - tradeIn.value;

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  banner.innerHTML = `<span>${newModel} ${newCapacity}</span><strong>${money(newPrice)} − ${money(tradeIn.value)} (Trade In) = ${money(base)}</strong>`;
  wrap.appendChild(banner);

  const options = [
    { key: "solo", label: "Solo equipo", extra: 0 },
    { key: "ac", label: "Equipo + AppleCare+", extra: ac.APPLECARE },
    { key: "acrp", label: "Equipo + AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
  ];

  wrap.appendChild(buildPlanTabs(options, base));
  return wrap;
}

// ---- Switch Up ----
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
    Object.keys(node).forEach(key => {
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
  banner.innerHTML = `<span>${newModel} ${newCapacity}</span><strong>${money(newPrice)} + ${money(MEMBRESIA_SWITCH)} membresía = ${money(base)}</strong>`;
  wrap.appendChild(banner);

  const options = [
    { key: "ac", label: "AppleCare+", extra: ac.APPLECARE },
    { key: "acrp", label: "AppleCare+ R y P", extra: ac.ROBO_PERDIDA },
  ];

  wrap.appendChild(buildPlanTabs(options, base));
  return wrap;
}

// ---- Componente reutilizable: pestañas de opción + chips de meses ----
function buildPlanTabs(options, base) {
  const wrap = document.createElement("div");

  const tabs = document.createElement("div");
  tabs.className = "plan-tabs";
  const panels = document.createElement("div");

  let activeIdx = 0;

  function renderPanel(idx) {
    panels.innerHTML = "";
    const opt = options[idx];
    const chipsRow = document.createElement("div");
    chipsRow.className = "month-chips";
    let selectedMonths = MESES[0];

    const resultBox = document.createElement("div");
    resultBox.className = "plan-result";

    function renderResult() {
      const plan = computePlan(base, opt.extra, selectedMonths);
      if (!plan) {
        resultBox.innerHTML = `<p class="pending">Precio pendiente de cargar.</p>`;
        return;
      }
      if (plan.split) {
        resultBox.innerHTML = `
          <div class="plan-phase"><span>Meses 1–10</span><strong>${money(plan.phase1.amount)}/mes</strong></div>
          <div class="plan-phase"><span>Meses 11–15</span><strong>${money(plan.phase2.amount)}/mes</strong></div>
        `;
      } else {
        resultBox.innerHTML = `<div class="plan-phase"><span>${selectedMonths} meses</span><strong>${money(plan.amount ?? plan.phase1?.amount)}/mes</strong></div>`;
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
    panels.appendChild(resultBox);
    renderResult();

    if (opt.extra) {
      const note = document.createElement("p");
      note.className = "plan-note";
      note.textContent = "* A 15 meses, AppleCare+ se financia solo en los primeros 10 meses.";
      panels.appendChild(note);
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

// ---- Primer render ----
render(true);

// ---- Registro del Service Worker (para instalar como PWA) ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
