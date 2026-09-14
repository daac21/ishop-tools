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
  { id: "cajas",     icon: "📦", label: "Código cajas",   color: "#8e8e93" },
];

// Iconos y color por categoría de cobertura
const COVERAGE_ICONS = {
  "iPhone": "📱", "iPad": "📓", "Mac": "🖥️", "Mac Neo": "💻",
  "Apple Watch": "⌚", "AirPods Pro": "🎧", "AirPods Max": "🎧",
  "HomePod": "🔊", "Apple TV": "📺",
};

const COVERAGE_TILE_COLORS = [
  "#0071e3",
  "#ff9500",
  "#34c759",
  "#5856d6",
  "#af52de",
  "#ff3b30",
  "#1d1d1f",
  "#0a84ff",
  "#30d158"
];

// Ícono/color por categoría para el apartado AppleCare+
// (datos/applecare_info.json)
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

async function loadAllData() {
  try {
    const [t, p, a, s, f, c, aci] = await Promise.all([
      fetch("datos/tradein.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/precios_iphone.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/applecare.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/switchup_modelos.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/financiamiento.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/cobertura.json", { cache: "no-store" }).then(r => r.json()),
      fetch("datos/applecare_info.json", { cache: "no-store" }).then(r => r.json()),
    ]);

    TRADEIN_DATA = t;
    PRECIOS_IPHONE = p;
    APPLECARE_DATA = a;
    SWITCHUP_MODELOS = s;
    FINANCIAMIENTO_DATA = f;
    COBERTURA_DATA = c;
    APPLECARE_INFO = aci;

    localStorage.setItem(
      "ishop_data_cache",
      JSON.stringify({
        tradein: t,
        precios_iphone: p,
        applecare: a,
        switchup_modelos: s,
        financiamiento: f,
        cobertura: c,
        applecare_info: aci
      })
    );
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
    } else {
      TRADEIN_DATA = {};
      PRECIOS_IPHONE = {};
      APPLECARE_DATA = {};
      SWITCHUP_MODELOS = [];
      FINANCIAMIENTO_DATA = {};
      COBERTURA_DATA = {};
      APPLECARE_INFO = {};
    }
  }
}

const dataReady = loadAllData();

let stack = [{ screen: "home", title: "iShop Tools" }];

const MESES = [3, 6, 9, 10, 12, 13, 15];
const MEMBRESIA_SWITCH = 399;

function money(n) {
  if (n === null || n === undefined || isNaN(n)) {
    return "Precio pendiente";
  }

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
      phase1: {
        months: acM,
        amount: base / 15 + safeExtra / acM
      },
      phase2: {
        months: 15 - acM,
        amount: base / 15
      },
    };
  }

  return {
    split: false,
    amount: (base + safeExtra) / months
  };
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

function render(isForward) {
  const entry = currentEntry();

  titleEl.textContent = entry.title;

  backBtn.hidden = stack.length === 1;
  homeBtn.hidden = stack.length === 1;

  const node = buildScreen(entry);

  node.classList.add("screen");

  if (isForward) {
    node.classList.add("enter");
  }

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
    el.appendChild(
      buildQuoteResult(
        entry.tradeIn,
        entry.newModel,
        entry.newCapacity
      )
    );

  } else if (entry.screen === "switchSelect") {
    el.appendChild(buildSwitchSelect(entry.path));

  } else if (entry.screen === "switchResult") {
    el.appendChild(
      buildSwitchResult(
        entry.newModel,
        entry.newCapacity
      )
    );

  } else if (entry.screen === "financeSelect") {
    el.appendChild(
      buildFinanceSelect(
        entry.path,
        entry.planType
      )
    );

  } else if (entry.screen === "financeResult") {
    el.appendChild(
      buildFinanceResult(
        entry.model,
        entry.capacity,
        entry.planType
      )
    );

  } else if (entry.screen === "acCategories") {
    el.appendChild(buildAcCategories());

  } else if (entry.screen === "acModels") {
    el.appendChild(buildAcModels(entry.category));

  } else if (entry.screen === "acVariants") {
    el.appendChild(
      buildAcVariants(
        entry.category,
        entry.model
      )
    );

  } else if (entry.screen === "acDetail") {
    el.appendChild(
      buildAcDetail(
        entry.category,
        entry.model,
        entry.variant
      )
    );

  } else if (entry.screen === "scanner") {
    el.appendChild(buildScanner());

  } else if (entry.screen === "tool") {
    const meta = MENU.find(m => m.id === entry.id);

    el.appendChild(
      buildPlaceholder(
        entry.title,
        meta ? meta.icon : "🔧",
        "Esta sección se conectará próximamente a datos/" +
          entry.id +
          ".json."
      )
    );
  }

  return el;
}

function buildHome() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");
  heading.className = "home-heading";
  heading.innerHTML = `
    <h2>iShop Tools</h2>
    <p>¿Qué herramienta necesitas?</p>
  `;

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
        if (!COBERTURA_DATA) {
          await dataReady;
        }

        navigate({
          screen: "coverage",
          title: item.label
        });

      } else if (item.id === "tradein") {
        if (!TRADEIN_DATA) {
          await dataReady;
        }

        navigate({
          screen: "tradeNode",
          path: [],
          title: item.label
        });

      } else if (item.id === "switchup") {
        if (!PRECIOS_IPHONE) {
          await dataReady;
        }

        navigate({
          screen: "switchSelect",
          path: [],
          title: item.label
        });

      } else if (item.id === "applecare") {
        if (!APPLECARE_INFO) {
          await dataReady;
        }

        navigate({
          screen: "acCategories",
          title: item.label
        });

      } else if (
        item.id === "forlife" ||
        item.id === "getac"
      ) {
        if (!FINANCIAMIENTO_DATA) {
          await dataReady;
        }

        const planType =
          item.id === "forlife"
            ? "IFL"
            : "GET";

        navigate({
          screen: "financeSelect",
          path: [],
          planType,
          title: item.label
        });

      } else if (item.id === "scanner") {
        navigate({
          screen: "scanner",
          title: item.label
        });

      } else {
        navigate({
          screen: "tool",
          id: item.id,
          title: item.label
        });
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
  heading.innerHTML = `<h2>¿Qué cubre?</h2>`;

  wrap.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "coverage-tile-grid";

  const categories = COBERTURA_DATA
    ? Object.keys(COBERTURA_DATA)
    : [];

  if (categories.length === 0) {
    wrap.appendChild(
      buildPlaceholder(
        "Sin datos",
        "🛠️",
        "Aún no hay información cargada en datos/cobertura.json."
      )
    );

    return wrap;
  }

  categories.forEach((cat, i) => {
    const tile = document.createElement("button");

    tile.className = "coverage-tile";

    tile.style.setProperty(
      "--tile-color",
      COVERAGE_TILE_COLORS[
        i % COVERAGE_TILE_COLORS.length
      ]
    );

    tile.innerHTML = `
      <span class="coverage-tile-icon">
        ${COVERAGE_ICONS[cat] || "🛠️"}
      </span>
      <span>${cat}</span>
    `;

    tile.addEventListener("click", () => {
      const variants = Object.keys(
        COBERTURA_DATA[cat]
      );

      if (variants.length === 1) {
        navigate({
          screen: "coverageDetail",
          category: cat,
          variant: variants[0],
          title: cat
        });
      } else {
        navigate({
          screen: "coverageVariant",
          category: cat,
          title: cat
        });
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
  heading.innerHTML = `
    <h2>
      ${COVERAGE_ICONS[category] || "🛠️"}
      ${category}
    </h2>
  `;

  wrap.appendChild(heading);

  const list = document.createElement("div");
  list.className = "sub-list";

  Object.keys(
    COBERTURA_DATA[category]
  ).forEach(variant => {
    const btn = document.createElement("button");

    btn.className = "sub-btn";

    btn.innerHTML = `
      <span>${variant}</span>
      <span class="chev"></span>
    `;

    btn.addEventListener("click", () => {
      navigate({
        screen: "coverageDetail",
        category,
        variant,
        title: variant
      });
    });

    list.appendChild(btn);
  });

  wrap.appendChild(list);

  return wrap;
}

function buildCoverageDetail(category, variant) {
  const wrap = document.createElement("div");

  const data =
    COBERTURA_DATA?.[category]?.[variant];

  const isRobo = /robo/i.test(variant);

  const hero = document.createElement("div");

  hero.className =
    "coverage-hero" +
    (isRobo ? " robo" : "");

  hero.innerHTML = `
    <span class="coverage-hero-icon">
      ${COVERAGE_ICONS[category] || "🛠️"}
    </span>

    <span class="coverage-hero-cat">
      ${category}
    </span>

    <strong>${variant}</strong>
  `;

  wrap.appendChild(hero);

  if (!data) {
    wrap.appendChild(
      buildPlaceholder(
        "Sin datos",
        "🛠️",
        "Aún no hay información cargada para esta cobertura."
      )
    );

    return wrap;
  }

  function section(title, icon, innerNode) {
    const sec = document.createElement("div");

    sec.className = "cov-section";

    const h = document.createElement("h3");

    h.innerHTML = `
      <span>${icon}</span>
      ${title}
    `;

    sec.appendChild(h);
    sec.appendChild(innerNode);

    wrap.appendChild(sec);
  }

  function chipList(items, kind) {
    const box = document.createElement("div");

    box.className = "chip-list";

    items.forEach(text => {
      const chip = document.createElement("span");

      chip.className =
        kind === "good"
          ? "chip-good"
          : "chip-bad";

      chip.textContent =
        (kind === "good" ? "✓ " : "✕ ") +
        text;

      box.appendChild(chip);
    });

    return box;
  }

  if (data.cubre?.length) {
    section(
      "Qué cubre",
      "✅",
      chipList(data.cubre, "good")
    );
  }

  if (data.no_cubre?.length) {
    section(
      "Qué no cubre",
      "❌",
      chipList(data.no_cubre, "bad")
    );
  }

  if (data.cuotas?.length) {
    const box = document.createElement("div");

    box.className = "fee-list";

    data.cuotas.forEach(c => {
      const row = document.createElement("div");

      row.className = "fee-row";

      row.innerHTML = `
        <span>${c.label}</span>
        <strong>${c.precio}</strong>
      `;

      box.appendChild(row);
    });

    section(
      "Cuotas de servicio",
      "💰",
      box
    );
  }

  if (data.si_aplica?.length) {
    section(
      "Casos que normalmente sí aplican",
      "📍",
      chipList(data.si_aplica, "good")
    );
  }

  if (data.rechazados?.length) {
    section(
      "Casos que pueden ser rechazados",
      "🚫",
      chipList(data.rechazados, "bad")
    );
  }

  if (data.bateria) {
    const box = document.createElement("div");

    box.className = "battery-box";

    box.innerHTML = `
      <span>${data.bateria.condicion}</span>
      <strong>${data.bateria.resultado}</strong>
    `;

    section(
      "Batería",
      "🔋",
      box
    );
  }

  if (data.info?.length) {
    const ul = document.createElement("ul");

    ul.className = "info-checklist";

    data.info.forEach(t => {
      const li = document.createElement("li");
      li.textContent = "✓ " + t;
      ul.appendChild(li);
    });

    section(
      "Información importante",
      "🔄",
      ul
    );
  }

  if (data.reclamo?.length) {
    const ol = document.createElement("ol");

    ol.className = "claim-steps";

    data.reclamo.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t;
      ol.appendChild(li);
    });

    section(
      "Cómo reclamar",
      "📋",
      ol
    );
  }

  return wrap;
}

/* =========================================================
   ESCÁNER
   ========================================================= */

function buildScanner() {
  const wrap = document.createElement("div");

  const heading = document.createElement("div");

  heading.className = "section-heading";

  heading.innerHTML = `
    <h2>📷 Escáner</h2>
    <p>Escanea un código de barras o QR con la cámara.</p>
  `;

  wrap.appendChild(heading);

  const card = document.createElement("div");

  card.className = "placeholder-card";
  card.style.textAlign = "center";

  const video = document.createElement("video");

  video.setAttribute("playsinline", "true");
  video.autoplay = true;
  video.muted = true;

  video.style.width = "100%";
  video.style.maxWidth = "520px";
  video.style.borderRadius = "18px";
  video.style.background = "#000";
  video.style.display = "none";
  video.style.margin = "0 auto 14px";

  const result = document.createElement("div");

  result.style.marginTop = "12px";
  result.style.fontWeight = "650";
  result.style.wordBreak = "break-word";

  const startBtn = document.createElement("button");

  startBtn.className = "sub-btn";
  startBtn.type = "button";

  startBtn.innerHTML = `
    <span>📷 Abrir cámara</span>
    <span class="chev"></span>
  `;

  const stopBtn = document.createElement("button");

  stopBtn.className = "sub-btn";
  stopBtn.type = "button";
  stopBtn.textContent = "Detener cámara";
  stopBtn.hidden = true;

  card.appendChild(video);
  card.appendChild(startBtn);
  card.appendChild(stopBtn);
  card.appendChild(result);

  wrap.appendChild(card);

  let stream = null;
  let detector = null;
  let scanning = false;
  let lastValue = "";

  function stopCamera() {
    scanning = false;

    if (stream) {
      stream
        .getTracks()
        .forEach(track => track.stop());

      stream = null;
    }

    video.srcObject = null;
    video.style.display = "none";

    startBtn.hidden = false;
    stopBtn.hidden = true;
  }

  async function scanLoop() {
    if (!scanning || !detector) {
      return;
    }

    try {
      if (video.readyState >= 2) {
        const codes =
          await detector.detect(video);

        if (codes.length) {
          const value =
            codes[0].rawValue || "";

          if (
            value &&
            value !== lastValue
          ) {
            lastValue = value;

            result.innerHTML = `
              <div>✅ Código detectado</div>

              <div
                style="
                  margin-top:6px;
                  user-select:text;
                "
              >
                ${value}
              </div>
            `;

            if (
              navigator.clipboard &&
              value
            ) {
              navigator.clipboard
                .writeText(value)
                .catch(() => {});
            }
          }
        }
      }
    } catch (_) {}

    if (scanning) {
      requestAnimationFrame(scanLoop);
    }
  }

  startBtn.addEventListener(
    "click",
    async () => {
      result.textContent = "";
      lastValue = "";

      if (!window.isSecureContext) {
        result.textContent =
          "⚠️ La cámara necesita HTTPS o localhost.";

        return;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        result.textContent =
          "⚠️ Este navegador no permite acceder a la cámara.";

        return;
      }

      if (!("BarcodeDetector" in window)) {
        result.textContent =
          "⚠️ Este navegador no tiene BarcodeDetector. " +
          "El botón de Escáner sí abre, pero necesitas " +
          "un navegador compatible para leer el código automáticamente.";

        return;
      }

      try {
        detector = new BarcodeDetector({
          formats: [
            "qr_code",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128",
            "code_39",
            "code_93",
            "codabar",
            "itf"
          ]
        });
      } catch (_) {
        detector = new BarcodeDetector();
      }

      try {
        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                ideal: "environment"
              }
            },
            audio: false
          });

        video.srcObject = stream;
        video.style.display = "block";

        startBtn.hidden = true;
        stopBtn.hidden = false;

        scanning = true;

        await video.play();

        scanLoop();

      } catch (error) {
        stopCamera();

        if (
          error &&
          error.name === "NotAllowedError"
        ) {
          result.textContent =
            "⚠️ Debes permitir el acceso a la cámara para usar el escáner.";
        } else {
          result.textContent =
            "⚠️ No se pudo abrir la cámara.";
        }
      }
    }
  );

  stopBtn.addEventListener(
    "click",
    stopCamera
  );

  return wrap;
}

/* =========================================================
   PLACEHOLDER
   ========================================================= */

function buildPlaceholder(
  title,
  emoji,
  message
) {
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

/* =========================================================
   TRADE IN
   ========================================================= */

const PRICE_ROWS = [
  {
    key: "ÓPTIMO",
    label: "Óptimo",
    color: "#34c759"
  },
  {
    key: "BATERÍA",
    label: "Batería",
    color: "#ff9500"
  },
  {
    key: "PANTALLA",
    label: "Pantalla",
    color: "#0071e3"
  },
  {
    key: "B Y P",
    label: "B y P",
    color: "#af52de"
  },
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
  return (
    node &&
    typeof node === "object" &&
    Object.prototype.hasOwnProperty.call(
      node,
      "ÓPTIMO"
    )
  );
}

function buildTradeNode(path) {
  const node = getNodeAtPath(path);

  const wrap = document.createElement("div");

  if (!node) {
    wrap.appendChild(
      buildPlaceholder(
        "Trade In",
        "🛒",
        "No se encontró información para esta selección."
      )
    );

    return wrap;
  }

  if (isPriceLeaf(node)) {
    const isIphone =
      path[0] === "iPhone";

    const heading =
      document.createElement("div");

    heading.className =
      "section-heading";

    heading.innerHTML = `
      <h2>${path[path.length - 1]}</h2>
    `;

    wrap.appendChild(heading);

    const list =
      document.createElement("div");

    list.className = "sub-list";

    PRICE_ROWS.forEach(row => {
      const raw =
        node[row.key] ?? "N/A";

      const numeric =
        parsePesoValue(raw);

      const item =
        document.createElement(
          isIphone && numeric !== null
            ? "button"
            : "div"
        );

      item.className = "sub-btn";

      item.innerHTML = `
        <span
          style="
            display:flex;
            align-items:center;
            gap:10px;
          "
        >
          <span
            style="
              width:9px;
              height:9px;
              border-radius:50%;
              background:${row.color};
              display:inline-block;
            "
          ></span>

          ${row.label}
        </span>

        <span
          style="
            font-weight:650;
          "
        >
          ${raw}
        </span>
      `;

      if (
        isIphone &&
        numeric !== null
      ) {
        item.addEventListener(
          "click",
          () => {
            navigate({
              screen: "quoteSelectNew",
              path: [],
              tradeIn: {
                model: path[1],
                capacity: path[2],
                value: numeric,
                condition: row.label
              },
              title: "Equipo nuevo"
            });
          }
        );
      }

      list.appendChild(item);
    });

    wrap.appendChild(list);

    return wrap;
  }

  const heading =
    document.createElement("div");

  heading.className =
    "section-heading";

  const label =
    path.length === 0
      ? "Trade In"
      : path[path.length - 1];

  heading.innerHTML = `
    <h2>
      ${
        path.length === 0
          ? "Selecciona un tipo"
          : label
      }
    </h2>
  `;

  wrap.appendChild(heading);

  const list =
    document.createElement("div");

  list.className = "sub-list";

  Object.keys(node).forEach(key => {
    const btn =
      document.createElement("button");

    btn.className = "sub-btn";

    btn.innerHTML = `
      <span>${key}</span>
      <span class="chev"></span>
    `;

    btn.addEventListener(
      "click",
      () => {
        navigate({
          screen: "tradeNode",
          path: [...path, key],
          title: key
        });
      }
    );

    list.appendChild(btn);
  });

  wrap.appendChild(list);

  return wrap;
}

function buildQuoteSelectNew(
  path,
  tradeIn
) {
  const node =
    getNodeAtPathIn(
      PRECIOS_IPHONE,
      path
    );

  const wrap =
    document.createElement("div");

  const banner =
    document.createElement("div");

  banner.className =
    "trade-banner";

  banner.innerHTML = `
    <span>Trade In seleccionado</span>
    <strong>
      ${tradeIn.model}
      ${tradeIn.capacity}
      · ${tradeIn.condition}
      · ${money(tradeIn.value)}
    </strong>
  `;

  wrap.appendChild(banner);

  const heading =
    document.createElement("div");

  heading.className =
    "section-heading";

  heading.innerHTML = `
    <h2>
      ${
        path.length === 0
          ? "Elige el iPhone nuevo"
          : path[path.length - 1]
      }
    </h2>
  `;

  wrap.appendChild(heading);

  const list =
    document.createElement("div");

  list.className = "sub-list";

  if (
    typeof node !== "object" ||
    node === null
  ) {
    wrap.appendChild(
      buildPlaceholder(
        "Sin datos",
        "📦",
        "Aún no hay precios cargados para esta selección."
      )
    );

    return wrap;
  }

  const isLeaf =
    Object.values(node).every(
      v =>
        v === null ||
        typeof v === "number"
    );

  if (isLeaf) {
    Object.entries(node).forEach(
      ([cap, price]) => {
        const btn =
          document.createElement(
            "button"
          );

        btn.className =
          "sub-btn";

        btn.innerHTML = `
          <span>${cap}</span>
          <span
            style="
              font-weight:650;
            "
          >
            ${money(price)}
          </span>
        `;

        btn.addEventListener(
          "click",
          () => {
            navigate({
              screen: "quoteResult",
              tradeIn,
              newModel:
                path[path.length - 1],
              newCapacity: cap,
              title: "Cotización"
            });
          }
        );

        list.appendChild(btn);
      }
    );

  } else {
    filteredModelKeys(
      node,
      path
    ).forEach(key => {
      const btn =
        document.createElement(
          "button"
        );

      btn.className =
        "sub-btn";

      btn.innerHTML = `
        <span>${key}</span>
        <span class="chev"></span>
      `;

      btn.addEventListener(
        "click",
        () => {
          navigate({
            screen: "quoteSelectNew",
            path: [...path, key],
            tradeIn,
            title: key
          });
        }
      );

      list.appendChild(btn);
    });
  }

  wrap.appendChild(list);

  return wrap;
}

function getNodeAtPathIn(
  root,
  path
) {
  let node = root;

  for (const key of path) {
    if (!node) return null;
    node = node[key];
  }

  return node;
}

function filteredModelKeys(
  node,
  path
) {
  if (
    path.length === 0 &&
    Array.isArray(SWITCHUP_MODELOS)
  ) {
    return SWITCHUP_MODELOS.filter(
      m =>
        Object.prototype.hasOwnProperty.call(
          node,
          m
        )
    );
  }

  return Object.keys(node);
}

function buildQuoteResult(
  tradeIn,
  newModel,
  newCapacity
) {
  const wrap =
    document.createElement("div");

  const newPrice =
    PRECIOS_IPHONE?.[newModel]?.[
      newCapacity
    ] ?? null;

  const ac =
    APPLECARE_DATA?.[newModel] || {};

  const base =
    newPrice === null
      ? null
      : newPrice - tradeIn.value;

  const banner =
    document.createElement("div");

  banner.className =
    "trade-banner";

  wrap.appendChild(banner);

  function updateBanner(opt) {
    if (newPrice === null) {
      banner.innerHTML = `
        <span>
          ${newModel} ${newCapacity}
        </span>

        <strong>
          Precio pendiente de cargar
        </strong>
      `;

      return;
    }

    let html = `
      <span>
        ${newModel} ${newCapacity}
      </span>

      <strong>
        ${money(newPrice)}
        −
        ${money(tradeIn.value)}
        (Trade In)
        =
        ${money(base)}
    `;

    if (
      opt &&
      opt.extra !== null &&
      opt.extra !== undefined &&
      opt.extra > 0
    ) {
      html += `
        +
        ${money(opt.extra)}
        ${opt.shortLabel}
        =
        ${money(base + opt.extra)}
        </strong>
      `;
    } else {
      html += `</strong>`;
    }

    banner.innerHTML = html;
  }

  const options = [
    {
      key: "solo",
      label: "Solo equipo",
      shortLabel: "Equipo",
      extra: 0
    },
    {
      key: "ac",
      label: "Equipo + AppleCare+",
      shortLabel: "AppleCare+",
      extra: ac.APPLECARE
    },
    {
      key: "acrp",
      label:
        "Equipo + AppleCare+ R y P",
      shortLabel:
        "AppleCare+ R y P",
      extra:
        ac.ROBO_PERDIDA
    },
  ];

  wrap.appendChild(
    buildPlanTabs(
      options,
      base,
      {
        onSelect: updateBanner
      }
    )
  );

  if (newPrice !== null) {
    wrap.appendChild(
      buildTradeInAltFinancing(
        tradeIn,
        newModel,
        newCapacity,
        newPrice,
        ac
      )
    );
  }

  return wrap;
}

function buildTradeInAltFinancing(
  tradeIn,
  newModel,
  newCapacity,
  newPrice,
  ac
) {
  const wrap =
    document.createElement("div");

  wrap.style.marginTop =
    "18px";

  const label =
    document.createElement("p");

  label.className =
    "plan-note";

  label.style.margin =
    "0 0 8px 2px";

  label.textContent =
    "¿Prefieres verlo en otra forma de pago?";

  wrap.appendChild(label);

  const select =
    document.createElement("select");

  select.className =
    "alt-finance-select";

  select.innerHTML = `
    <option value="">
      Elegir…
    </option>

    <option value="IFL">
      iPhone For Life + AC
    </option>

    <option value="GET">
      GET + AC
    </option>

    <option value="switchup">
      Switch Up
    </option>
  `;

  wrap.appendChild(select);

  const resultArea =
    document.createElement("div");

  resultArea.style.marginTop =
    "12px";

  wrap.appendChild(resultArea);

  select.addEventListener(
    "change",
    () => {
      resultArea.innerHTML = "";

      if (!select.value) return;

      if (
        select.value ===
        "switchup"
      ) {
        const switchBase =
          newPrice +
          MEMBRESIA_SWITCH -
          tradeIn.value;

        const banner =
          document.createElement(
            "div"
          );

        banner.className =
          "trade-banner";

        banner.innerHTML = `
          <span>
            Switch Up con Trade In
          </span>

          <strong>
            ${money(newPrice)}
            +
            ${money(MEMBRESIA_SWITCH)}
            −
            ${money(tradeIn.value)}
            (Trade In)
            =
            ${money(switchBase)}
          </strong>
        `;

        resultArea.appendChild(
          banner
        );

        const options = [
          {
            key: "ac",
            label: "AppleCare+",
            extra:
              ac.APPLECARE
          },
          {
            key: "acrp",
            label:
              "AppleCare+ R y P",
            extra:
              ac.ROBO_PERDIDA
          },
        ];

        resultArea.appendChild(
          buildPlanTabs(
            options,
            switchBase
          )
        );

        return;
      }

      const cfg =
        FINANCE_CONFIG[
          select.value
        ];

      const finData =
        FINANCIAMIENTO_DATA
          ?.[newModel]
          ?.[newCapacity]
          ?.[select.value];

      if (!finData) {
        resultArea.appendChild(
          buildPlaceholder(
            "Sin datos",
            "💳",
            "Aún no hay plan " +
              cfg.label +
              " cargado para este equipo."
          )
        );

        return;
      }

      const totalMsi =
        cfg.phase1 +
        cfg.phase2Months;

      const descuentoMensual =
        tradeIn.value /
        totalMsi;

      const discountedFinData =
        {
          monthly:
            Math.max(
              0,
              finData.monthly -
                descuentoMensual
            ),

          residual:
            finData.residual
        };

      const banner =
        document.createElement(
          "div"
        );

      banner.className =
        "trade-banner";

      banner.innerHTML = `
        <span>
          ${cfg.label}
          con Trade In
        </span>

        <strong>
          ${money(finData.monthly)}
          /mes
          −
          ${money(descuentoMensual)}
          (Trade In ÷ ${totalMsi} msi)
          =
          ${money(
            discountedFinData.monthly
          )}
          /mes
        </strong>
      `;

      resultArea.appendChild(
        banner
      );

      resultArea.appendChild(
        buildFinanceColumnsGrid(
          discountedFinData,
          ac,
          cfg
        )
      );
    }
  );

  return wrap;
}

/* =========================================================
   SWITCH UP
   ========================================================= */

function buildSwitchSelect(path) {
  const node =
    getNodeAtPathIn(
      PRECIOS_IPHONE,
      path
    );

  const wrap =
    document.createElement("div");

  const heading =
    document.createElement("div");

  heading.className =
    "section-heading";

  heading.innerHTML = `
    <h2>
      ${
        path.length === 0
          ? "Elige el iPhone nuevo"
          : path[path.length - 1]
      }
    </h2>
  `;

  wrap.appendChild(heading);

  const list =
    document.createElement("div");

  list.className =
    "sub-list";

  if (
    typeof node !== "object" ||
    node === null
  ) {
    wrap.appendChild(
      buildPlaceholder(
        "Sin datos",
        "🔄",
        "Aún no hay precios cargados para esta selección."
      )
    );

    return wrap;
  }

  const isLeaf =
    Object.values(node).every(
      v =>
        v === null ||
        typeof v === "number"
    );

  if (isLeaf) {
    Object.entries(node).forEach(
      ([cap, price]) => {
        const btn =
          document.createElement(
            "button"
          );

        btn.className =
          "sub-btn";

        btn.innerHTML = `
          <span>${cap}</span>

          <span
            style="font-weight:650;"
          >
            ${money(price)}
          </span>
        `;

        btn.addEventListener(
          "click",
          () => {
            navigate({
              screen: "switchResult",
              newModel:
                path[path.length - 1],
              newCapacity: cap,
              title: "Switch Up"
            });
          }
        );

        list.appendChild(btn);
      }
    );

  } else {
    filteredModelKeys(
      node,
      path
    ).forEach(key => {
      const btn =
        document.createElement(
          "button"
        );

      btn.className =
        "sub-btn";

      btn.innerHTML = `
        <span>${key}</span>
        <span class="chev"></span>
      `;

      btn.addEventListener(
        "click",
        () => {
          navigate({
            screen:
              "switchSelect",
            path: [...path, key],
            title: key
          });
        }
      );

      list.appendChild(btn);
    });
  }

  wrap.appendChild(list);

  return wrap;
}

function buildSwitchResult(
  newModel,
  newCapacity
) {
  const wrap =
    document.createElement("div");

  const newPrice =
    PRECIOS_IPHONE?.[newModel]?.[
      newCapacity
    ] ?? null;

  const ac =
    APPLECARE_DATA?.[newModel] || {};

  const base =
    newPrice === null
      ? null
      : newPrice +
        MEMBRESIA_SWITCH;

  const banner =
    document.createElement("div");

  banner.className =
    "trade-banner";

  wrap.appendChild(banner);

  function updateBanner(opt) {
    if (newPrice === null) {
      banner.innerHTML = `
        <span>
          ${newModel} ${newCapacity}
        </span>

        <strong>
          Precio pendiente de cargar
        </strong>
      `;

      return;
    }

    let html = `
      <span>
        ${newModel} ${newCapacity}
      </span>

      <strong>
        ${money(newPrice)}
        +
        ${money(MEMBRESIA_SWITCH)}
        membresía
    `;

    if (
      opt &&
      opt.extra !== null &&
      opt.extra !== undefined
    ) {
      html += `
        +
        ${money(opt.extra)}
        ${opt.label}
        =
        ${money(base + opt.extra)}
      </strong>`;
    } else {
      html += `
        =
        ${money(base)}
      </strong>`;
    }

    banner.innerHTML = html;
  }

  const options = [
    {
      key: "ac",
      label: "AppleCare+",
      extra:
        ac.APPLECARE
    },
    {
      key: "acrp",
      label:
        "AppleCare+ R y P",
      extra:
        ac.ROBO_PERDIDA
    },
  ];

  wrap.appendChild(
    buildPlanTabs(
      options,
      base,
      {
        onSelect:
          updateBanner,
        phonePrice:
          newPrice
      }
    )
  );

  return wrap;
}

/* =========================================================
   APPLECARE
   ========================================================= */

function buildAcCategories() {
  const wrap =
    document.createElement("div");

  const heading =
    document.createElement("div");

  heading.className =
    "home-heading";

  heading.innerHTML = `
    <h2>AppleCare+</h2>
    <p>
      Protección oficial Apple para cada equipo.
    </p>
  `;

  wrap.appendChild(heading);

  const cats =
    APPLECARE_INFO
      ? Object.keys(
          APPLECARE_INFO
        )
      : [];

  if (cats.length === 0) {
    wrap.appendChild(
      buildPlaceholder(
        "Sin datos",
        "🛡️",
        "Aún no hay información de AppleCare+ cargada."
      )
    );

    return wrap;
  }

  const list =
    document.createElement("div");

  list.className =
    "tool-list";

  cats.forEach(cat => {
    const meta =
      AC_CATEGORY_META[cat] ||
      {
        icon: "🛡️",
        color: "#0071e3"
      };

    const btn =
      document.createElement(
        "button"
      );

    btn.className =
      "tool-btn";

    btn.style.setProperty(
      "--tool-color",
      meta.color
    );

    btn.innerHTML = `
      <span class="tool-icon">
        ${meta.icon}
      </span>

      <span class="tool-label">
        ${cat}
      </span>

      <span class="chev"></span>
    `;

    btn.addEventListener(
      "click",
      () => {
        navigate({
          screen: "acModels",
          category: cat,
          title: cat
        });
      }
    );

    list.appendChild(btn);
  });

  wrap.appendChild(list);

  return wrap;
}

function buildAcModels(
  category
) {
  const wrap =
    document.createElement("div");

  const heading =
    document.createElement("div");

  heading.className =
    "section-heading";

  heading.innerHTML = `
    <h2>${category}</h2>
  `;

  wrap.appendChild(heading);

  const models =
    APPLECARE_INFO?.[
      category
    ] || {};

  const list =
    document.createElement("div");

  list.className =
    "sub-list";

  Object.keys(models).forEach(
    model => {
      const btn =
        document.createElement(
          "button"
        );

      btn.className =
        "sub-btn";

      btn.innerHTML = `
        <span>${model}</span>
        <span class="chev"></span>
      `;

      btn.addEventListener(
        "click",
        () => {
          const variants =
            Object.keys(
              models[model]
            );

          if (
            variants.length === 1
          ) {
            navigate({
              screen:
                "acDetail",
              category,
              model,
              variant:
                variants[0],
              title: model
            });
          } else {
            navigate({
              screen:
                "acVariants",
              category,
              model,
              title: model
            });
          }
        }
      );

      list.appendChild(btn);
    }
  );

  wrap.appendChild(list);

  return wrap;
}

function buildAcVariants(
  category,
  model
) {
  const wrap =
    document.createElement("div");

  const heading =
    document.createElement("div");

  heading.className =
    "section-heading";

  heading.innerHTML = `
    <h2>${model}</h2>
  `;

  wrap.appendChild(heading);

  const variants =
    APPLECARE_INFO?.[
      category
    ]?.[model] || {};

  const list =
    document.createElement("div");

  list.className =
    "sub-list";

  Object.keys(
    variants
  ).forEach(v => {
    const btn =
      document.createElement(
        "button"
      );

    btn.className =
      "sub-btn";

    btn.innerHTML = `
      <span>${v}</span>
      <span class="chev"></span>
    `;

    btn.addEventListener(
      "click",
      () => {
        navigate({
          screen:
            "acDetail",
          category,
          model,
          variant: v,
          title: v
        });
      }
    );

    list.appendChild(btn);
  });

  wrap.appendChild(list);

  return wrap;
}

function buildAcDetail(
  category,
  model,
  variant
) {
  const wrap =
    document.createElement("div");

  const info =
    APPLECARE_INFO?.[
      category
    ]?.[model]?.[variant];

  if (!info) {
    wrap.appendChild(
      buildPlaceholder(
        "Sin datos",
        "🛡️",
        "Aún no hay información cargada para este equipo."
      )
    );

    return wrap;
  }

  const roboPrice =
    info["Robo y Extravío"];

  const hasRobo =
    roboPrice !== undefined &&
    roboPrice !== null;

  const hero =
    document.createElement(
      "div"
    );

  hero.className =
    "ac-hero";

  hero.innerHTML = `
    <span class="ac-hero-icon">
      🛡️
    </span>

    <h2>${model}</h2>

    <p class="ac-hero-sub">
      ${variant}
    </p>

    ${
      hasRobo
        ? `
          <div class="ac-price-row">
            <div class="ac-price-box">
              <span>AppleCare+</span>
              <strong>
                ${money(info.precio)}
              </strong>
            </div>

            <div class="ac-price-box robo">
              <span>Robo y Extravío</span>
              <strong>
                ${money(roboPrice)}
              </strong>
            </div>
          </div>
        `
        : `
          <div class="ac-price">
            ${money(info.precio)}
          </div>
        `
    }
  `;

  wrap.appendChild(hero);

  if (
    Array.isArray(info.cubre) &&
    info.cubre.length
  ) {
    const benefits =
      document.createElement(
        "div"
      );

    benefits.className =
      "ac-benefits";

    benefits.innerHTML = `
      <h4>Incluye</h4>
      <ul>
        ${info.cubre
          .map(
            c =>
              `<li>${c}</li>`
          )
          .join("")}
      </ul>
    `;

    wrap.appendChild(
      benefits
    );
  }

  if (
    info.deducibles &&
    Object.keys(
      info.deducibles
    ).length
  ) {
    const deduc =
      document.createElement(
        "div"
      );

    deduc.className =
      "plan-result";

    deduc.innerHTML =
      `
        <h4
          style="
            margin:0 0 2px;
            font-size:12px;
            font-weight:700;
            color:var(--text-secondary);
            text-transform:uppercase;
            letter-spacing:0.05em;
          "
        >
          Deducibles
        </h4>
      ` +
      Object.entries(
        info.deducibles
      )
        .map(
          ([k, v]) =>
            `
              <div class="plan-phase">
                <span>${k}</span>
                <strong>
                  ${money(v)}
                </strong>
              </div>
            `
        )
        .join("");

    wrap.appendChild(deduc);
  }

  return wrap;
}

/* =========================================================
   PLANES
   ========================================================= */

function buildPlanTabs(
  options,
  base,
  extraOpts = {}
) {
  const {
    onSelect,
    phonePrice
  } = extraOpts;

  const wrap =
    document.createElement("div");

  const tabs =
    document.createElement("div");

  tabs.className =
    "plan-tabs";

  const panels =
    document.createElement("div");

  let activeIdx = 0;

  function renderPanel(idx) {
    panels.innerHTML = "";

    const opt =
      options[idx];

    if (
      typeof onSelect ===
      "function"
    ) {
      onSelect(opt);
    }

    const chipsRow =
      document.createElement(
        "div"
      );

    chipsRow.className =
      "month-chips";

    let selectedMonths =
      MESES[0];

    const acChipsRow =
      document.createElement(
        "div"
      );

    acChipsRow.className =
      "month-chips";

    acChipsRow.hidden =
      true;

    let selectedAcMonths =
      10;

    [10, 12, 13].forEach(
      m => {
        const chip =
          document.createElement(
            "button"
          );

        chip.className =
          "chip" +
          (
            m ===
            selectedAcMonths
              ? " active"
              : ""
          );

        chip.textContent =
          "AC " +
          m +
          " msi";

        chip.addEventListener(
          "click",
          () => {
            selectedAcMonths =
              m;

            acChipsRow
              .querySelectorAll(
                ".chip"
              )
              .forEach(
                c =>
                  c.classList.remove(
                    "active"
                  )
              );

            chip.classList.add(
              "active"
            );

            renderResult();
          }
        );

        acChipsRow.appendChild(
          chip
        );
      }
    );

    const resultBox =
      document.createElement(
        "div"
      );

    resultBox.className =
      "plan-result";

    function renderResult() {
      if (
        base === null ||
        base === undefined
      ) {
        resultBox.innerHTML = `
          <p class="pending">
            Precio del equipo pendiente de cargar.
          </p>
        `;

        acChipsRow.hidden =
          true;

        return;
      }

      if (opt.extra === null) {
        resultBox.innerHTML = `
          <p class="pending">
            Precio de AppleCare+ pendiente de cargar.
          </p>
        `;

        acChipsRow.hidden =
          true;

        return;
      }

      acChipsRow.hidden =
        !(
          selectedMonths === 15 &&
          opt.extra > 0
        );

      const plan =
        computePlan(
          base,
          opt.extra,
          selectedMonths,
          selectedAcMonths
        );

      if (!plan) {
        resultBox.innerHTML = `
          <p class="pending">
            Precio pendiente de cargar.
          </p>
        `;

        return;
      }

      if (plan.split) {
        resultBox.innerHTML = `
          <div class="plan-phase">
            <span>
              Mes 1 a ${plan.acMonths}
              (con AppleCare+)
            </span>

            <strong>
              ${money(plan.phase1.amount)}
              /mes
            </strong>
          </div>

          <div class="plan-phase">
            <span>
              Mes ${plan.acMonths + 1}
              a 15
              (solo iPhone)
            </span>

            <strong>
              ${money(plan.phase2.amount)}
              /mes
            </strong>
          </div>
        `;
      } else {
        resultBox.innerHTML = `
          <div class="plan-phase">
            <span>
              ${selectedMonths} meses
            </span>

            <strong>
              ${money(plan.amount)}
              /mes
            </strong>
          </div>
        `;
      }
    }

    MESES.forEach(m => {
      const chip =
        document.createElement(
          "button"
        );

      chip.className =
        "chip" +
        (
          m ===
          selectedMonths
            ? " active"
            : ""
        );

      chip.textContent =
        m +
        (
          m === 15
            ? "*"
            : ""
        );

      chip.addEventListener(
        "click",
        () => {
          selectedMonths =
            m;

          chipsRow
            .querySelectorAll(
              ".chip"
            )
            .forEach(
              c =>
                c.classList.remove(
                  "active"
                )
            );

          chip.classList.add(
            "active"
          );

          renderResult();
        }
      );

      chipsRow.appendChild(
        chip
      );
    });

    panels.appendChild(
      chipsRow
    );

    panels.appendChild(
      acChipsRow
    );

    panels.appendChild(
      resultBox
    );

    renderResult();

    if (opt.extra) {
      const note =
        document.createElement(
          "p"
        );

      note.className =
        "plan-note";

      note.textContent =
        "* A 15 meses, el AppleCare+ " +
        "se financia solo dentro de los meses " +
        "que elijas (10, 12 o 13).";

      panels.appendChild(
        note
      );

      if (
        phonePrice !== undefined &&
        phonePrice !== null
      ) {
        const promoBox =
          document.createElement(
            "div"
          );

        promoBox.className =
          "plan-result";

        promoBox.style.marginTop =
          "10px";

        promoBox.innerHTML = `
          <div class="plan-phase">
            <span>
              50% del equipo
            </span>

            <strong>
              ${money(
                phonePrice * 0.5
              )}
            </strong>
          </div>

          <div class="plan-phase">
            <span>
              50% de ${opt.label}
            </span>

            <strong>
              ${money(
                opt.extra * 0.5
              )}
            </strong>
          </div>
        `;

        panels.appendChild(
          promoBox
        );

        const promoNote =
          document.createElement(
            "p"
          );

        promoNote.className =
          "plan-note";

        promoNote.textContent =
          "50% aplicable dentro de los primeros 13 meses.";

        panels.appendChild(
          promoNote
        );
      }
    }
  }

  options.forEach(
    (opt, idx) => {
      const tab =
        document.createElement(
          "button"
        );

      tab.className =
        "plan-tab" +
        (
          idx === 0
            ? " active"
            : ""
        );

      tab.textContent =
        opt.label;

      tab.addEventListener(
        "click",
        () => {
          tabs
            .querySelectorAll(
              ".plan-tab"
            )
            .forEach(
              t =>
                t.classList.remove(
                  "active"
                )
            );

          tab.classList.add(
            "active"
          );

          activeIdx = idx;

          renderPanel(idx);
        }
      );

      tabs.appendChild(
        tab
      );
    }
  );

  wrap.appendChild(tabs);
  wrap.appendChild(panels);

  renderPanel(0);

  return wrap;
}

/* =========================================================
   FINANCIAMIENTO
   ========================================================= */

const FINANCE_CONFIG = {
  IFL: {
    label: "iPhone For Life",
    phase1: 10,
    phase2Start: 11,
    phase2End: 24,
    phase2Months: 14,
    residualMonth: 25
  },

  GET: {
    label: "GET",
    phase1: 13,
    phase2Start: 14,
    phase2End: 20,
    phase2Months: 7,
    residualMonth: 21
  },
};

function buildFinanceSelect(
  path,
  planType
) {
  const wrap =
    document.createElement(
      "div"
    );

  const heading =
    document.createElement(
      "div"
    );

  heading.className =
    "section-heading";

  if (path.length === 0) {
    heading.innerHTML =
      `<h2>Elige el iPhone</h2>`;

    wrap.appendChild(
      heading
    );

    const list =
      document.createElement(
        "div"
      );

    list.className =
      "sub-list";

    const models =
      FINANCIAMIENTO_DATA
        ? Object.keys(
            FINANCIAMIENTO_DATA
          )
        : [];

    if (models.length === 0) {
      wrap.appendChild(
        buildPlaceholder(
          "Sin datos",
          "💳",
          "Aún no hay planes cargados en datos/financiamiento.json."
        )
      );

      return wrap;
    }

    models.forEach(
      model => {
        const btn =
          document.createElement(
            "button"
          );

        btn.className =
          "sub-btn";

        btn.innerHTML = `
          <span>${model}</span>
          <span class="chev"></span>
        `;

        btn.addEventListener(
          "click",
          () => {
            navigate({
              screen:
                "financeSelect",
              path: [model],
              planType,
              title: model
            });
          }
        );

        list.appendChild(
          btn
        );
      }
    );

    wrap.appendChild(list);

    return wrap;
  }

  const model =
    path[0];

  const caps =
    FINANCIAMIENTO_DATA?.[
      model
    ] || {};

  heading.innerHTML =
    `<h2>${model}</h2>`;

  wrap.appendChild(
    heading
  );

  const list =
    document.createElement(
      "div"
    );

  list.className =
    "sub-list";

  Object.keys(
    caps
  ).forEach(cap => {
    const btn =
      document.createElement(
        "button"
      );

    btn.className =
      "sub-btn";

    btn.innerHTML = `
      <span>${cap}</span>
      <span class="chev"></span>
    `;

    btn.addEventListener(
      "click",
      () => {
        navigate({
          screen:
            "financeResult",
          model,
          capacity: cap,
          planType,
          title: cap
        });
      }
    );

    list.appendChild(
      btn
    );
  });

  wrap.appendChild(list);

  return wrap;
}

function buildFinanceResult(
  model,
  capacity,
  planType
) {
  const wrap =
    document.createElement(
      "div"
    );

  const cfg =
    FINANCE_CONFIG[
      planType
    ];

  const finData =
    FINANCIAMIENTO_DATA
      ?.[model]
      ?.[capacity]
      ?.[planType];

  const ac =
    APPLECARE_DATA?.[
      model
    ] || {};

  const banner =
    document.createElement(
      "div"
    );

  banner.className =
    "trade-banner";

  banner.innerHTML = `
    <span>
      ${cfg.label}
    </span>

    <strong>
      ${model}
      ${capacity}
    </strong>
  `;

  wrap.appendChild(
    banner
  );

  if (!finData) {
    wrap.appendChild(
      buildPlaceholder(
        "Sin datos",
        "💳",
        "Aún no hay plan " +
          cfg.label +
          " cargado para este equipo."
      )
    );

    return wrap;
  }

  wrap.appendChild(
    buildFinanceColumnsGrid(
      finData,
      ac,
      cfg
    )
  );

  return wrap;
}

function buildFinanceColumnsGrid(
  finData,
  ac,
  cfg
) {
  const cols = [
    {
      label: "AppleCare+",
      extra:
        ac.APPLECARE
    },

    {
      label:
        "AppleCare+ R y P",
      extra:
        ac.ROBO_PERDIDA
    },
  ];

  const grid =
    document.createElement(
      "div"
    );

  grid.className =
    "finance-columns";

  cols.forEach(
    col => {
      const card =
        document.createElement(
          "div"
        );

      card.className =
        "finance-col";

      if (
        col.extra === null ||
        col.extra === undefined
      ) {
        card.innerHTML = `
          <h4>
            ${col.label}
          </h4>

          <p class="pending">
            AppleCare+ pendiente
          </p>
        `;

        grid.appendChild(
          card
        );

        return;
      }

      const phase1Amount =
        finData.monthly +
        col.extra /
          cfg.phase1;

      const phase2Amount =
        finData.monthly;

      const residual =
        finData.residual;

      const total =
        phase1Amount *
          cfg.phase1 +
        phase2Amount *
          cfg.phase2Months +
        residual;

      card.innerHTML = `
        <h4>
          ${col.label}
        </h4>

        <div class="finance-row">
          <span>
            Mes 1–${cfg.phase1}
          </span>

          <strong>
            ${money(phase1Amount)}
          </strong>
        </div>

        <div class="finance-row">
          <span>
            Mes
            ${cfg.phase1 + 1}
            –
            ${cfg.phase2End}
          </span>

          <strong>
            ${money(phase2Amount)}
          </strong>
        </div>

        <div class="finance-row">
          <span>
            Mes
            ${cfg.residualMonth}
            (saldo)
          </span>

          <strong>
            ${money(residual)}
          </strong>
        </div>

        <div class="finance-row total">
          <span>
            Total
          </span>

          <strong>
            ${money(total)}
          </strong>
        </div>
      `;

      grid.appendChild(
        card
      );
    }
  );

  return grid;
}

/* =========================================================
   INICIO
   ========================================================= */

render(true);

/* =========================================================
   SERVICE WORKER
   ========================================================= */

if (
  "serviceWorker" in navigator
) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("sw.js")
        .catch(() => {});
    }
  );
}
