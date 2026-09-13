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

// ---- Datos: se leen de datos/*.json (ese mismo repo de GitHub).
// Cada vez que subas un cambio a GitHub, Netlify republica solo y la app
// jala la versión nueva. Se guarda una copia en el teléfono por si no hay internet.
let TRADEIN_DATA = null;
let PRECIOS_IPHONE = null;
let APPLECARE_DATA = null;
// Lista de modelos que se muestran en Switch Up (y en qué orden).
// Se edita solo este archivo (datos/switchup_modelos.json) para
// agregar/quitar modelos del apartado, sin tocar precios.
let SWITCHUP_MODELOS = null;
let FINANCIAMIENTO_DATA = null;

async function loadAllData() {
  try {
    const [t, p, a, s, f] = await Promise.all([
      fetch("datos/tradein.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/precios_iphone.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/applecare.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/switchup_modelos.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/financiamiento.json", { cache: "no-store" }).then(r => r.json()),
    ]);
    TRADEIN_DATA = t;
    PRECIOS_IPHONE = p;
    APPLECARE_DATA = a;
    SWITCHUP_MODELOS = s;
    FINANCIAMIENTO_DATA = f;
    localStorage.setItem("ishop_data_cache", JSON.stringify({ tradein: t, precios_iphone: p, applecare: a, switchup_modelos: s, financiamiento: f }));
  } catch (e) {
    const cached = localStorage.getItem("ishop_data_cache");
    if (cached) {
      const data = JSON.parse(cached);
      TRADEIN_DATA = data.tradein || {};
      PRECIOS_IPHONE = data.precios_iphone || {};
      APPLECARE_DATA = data.applecare || {};
      SWITCHUP_MODELOS = data.switchup_modelos || [];
      FINANCIAMIENTO_DATA = data.financiamiento || {};
    } else {
      TRADEIN_DATA = {};
      PRECIOS_IPHONE = {};
      APPLECARE_DATA = {};
      SWITCHUP_MODELOS = [];
      FINANCIAMIENTO_DATA = {};
    }
  }
}
const dataReady = loadAllData();

// ---- Estado de navegación ----
// Cada entrada: { screen: "home" | "tool" | "coverageDetail" | "tradeNode" | "quoteSelectNew" | "quoteResult" | "switchResult", ...params, title }
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

// base se reparte en 15 meses siempre; extra (AppleCare) solo dentro de
// los primeros acMonths (10, 12 o 13, elegible por el usuario)
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
  } else if (entry.screen === "financeSelect") {
    el.appendChild(buildFinanceSelect(entry.path, entry.planType));
  } else if (entry.screen === "financeResult") {
    el.appendChild(buildFinanceResult(entry.model, entry.capacity, entry.planType));
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
      } else if (item.id === "forlife" || item.id === "getac") {
        if (!FINANCIAMIENTO_DATA) await dataReady;
        const planType = item.id === "forlife" ? "IFL" : "GET";
        navigate({ screen: "financeSelect", path: [], planType, title: item.label });
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
      // Redirección inmediata a elegir el iPhone nuevo. Solo aplica en la
      // categoría iPhone (isIphone) — iPad/Mac/Apple Watch no cotizan aquí.
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

// En el primer nivel (elegir modelo) se muestra solo la lista corta de
// datos/switchup_modelos.json, en ese orden. Se usa tanto en Trade In
// como en Switch Up para elegir el iPhone nuevo.
function filteredModelKeys(node, path) {
  if (path.length === 0 && Array.isArray(SWITCHUP_MODELOS)) {
    return SWITCHUP_MODELOS.filter(m => Object.prototype.hasOwnProperty.call(node, m));
  }
  return Object.keys(node);
}

// ---- Resultado de cotización Trade In (3 opciones x plazos) ----
function buildQuoteResult(tradeIn, newModel, newCapacity) {
  const wrap = document.createElement("div");
  const newPrice = PRECIOS_IPHONE?.[newModel]?.[newCapacity] ?? null;
  const ac = APPLECARE_DATA?.[newModel] || {};
  const base = newPrice === null ? null : newPrice - tradeIn.value;

  const banner = document.createElement("div");
  banner.className = "trade-banner";
  wrap.appendChild(banner);

  // El recuadro se actualiza según la pestaña activa: equipo − Trade In
  // [+ AppleCare+ seleccionado] = total.
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

  // El recuadro superior se actualiza según la opción (AppleCare+ / R y P)
  // que esté activa en las pestañas: equipo + membresía [+ AppleCare+] = total.
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

// ---- Componente reutilizable: pestañas de opción + chips de meses ----
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

    // Solo visible cuando el plazo elegido es 15 meses y la opción incluye
    // AppleCare+: permite elegir en cuántos meses (10, 12 o 13) se financia.
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

      // Recuadro de promoción: 50% del equipo + 50% del AppleCare+ seleccionado,
      // aplicable dentro de los primeros 13 meses. Solo aplica donde se
      // conoce el precio del equipo solo (phonePrice), es decir, Switch Up.
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

// ---- For Life + AC / GET + AC ----
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

  wrap.appendChild(grid);
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
