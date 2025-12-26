console.log("Frontend loaded");

/* ===========================
   CONFIG
=========================== */
const API_BASE = window.API_BASE || ""; // SAFE DEFAULT

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let previousPrices = {};
let optionsCache = [];
let currentFilter = "all";

let alerts = JSON.parse(localStorage.getItem("alerts") || "[]");

/* ===========================
   SCANNER STATE
=========================== */
let scannerRunning = false;
let scannerInterval = null;

/* ===========================
   HELPERS
=========================== */
function safeEl(id) {
  return document.getElementById(id);
}

/* ===========================
   ALERT STORAGE
=========================== */
function saveAlerts() {
  localStorage.setItem("alerts", JSON.stringify(alerts));
}

/* ===========================
   ALERT RENDER
=========================== */
function renderAlerts() {
  const out = safeEl("alertsOutput");
  if (!out) return;

  if (!alerts.length) {
    out.innerHTML = "No alerts set";
    return;
  }

  let html = `<table>
    <tr><th>Symbol</th><th>Condition</th><th></th></tr>`;

  alerts.forEach((a, i) => {
    html += `
      <tr>
        <td>${a.symbol}</td>
        <td>${a.type} ${a.value}</td>
        <td><button data-i="${i}" class="delAlert">✖</button></td>
      </tr>`;
  });

  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".delAlert").forEach(btn => {
    btn.onclick = () => {
      alerts.splice(btn.dataset.i, 1);
      saveAlerts();
      renderAlerts();
    };
  });
}

/* ===========================
   SCANNER LOG
=========================== */
function logScanner(msg) {
  const log = safeEl("scannerLog");
  if (!log) return;

  const time = new Date().toLocaleTimeString();
  log.innerHTML = `<div>[${time}] ${msg}</div>` + log.innerHTML;
}

/* ===========================
   SCANNER RULES
=========================== */
function runScanner(newCandidates) {
  newCandidates.forEach(c => {
    const prev = previousPrices[c.symbol];
    if (!prev || !c.price) return;

    const pct = ((c.price - prev) / prev) * 100;

    if (pct >= 5) {
      logScanner(`🚀 ${c.symbol} UP ${pct.toFixed(2)}%`);
    }

    if (pct <= -5) {
      logScanner(`📉 ${c.symbol} DOWN ${pct.toFixed(2)}%`);
    }

    if (c.price <= 1) {
      logScanner(`💸 ${c.symbol} under $1 (${c.price})`);
    }

    if (Math.abs(pct) >= 8) {
      logScanner(`⚡ ${c.symbol} VOLATILE ${pct.toFixed(2)}%`);
    }
  });
}

/* ===========================
   MAIN
=========================== */
document.addEventListener("DOMContentLoaded", () => {

  /* ===== THEME ===== */
  const themeToggle = safeEl("themeToggle");
  const savedTheme = localStorage.getItem("theme") || "dark";

  if (savedTheme === "light") {
    document.body.classList.add("light");
    if (themeToggle) themeToggle.textContent = "☀️ Light";
  }

  if (themeToggle) {
    themeToggle.onclick = () => {
      document.body.classList.toggle("light");
      const isLight = document.body.classList.contains("light");
      localStorage.setItem("theme", isLight ? "light" : "dark");
      themeToggle.textContent = isLight ? "☀️ Light" : "🌙 Dark";
    };
  }

  /* ===== ELEMENTS ===== */
  const candidatesBtn = safeEl("candidatesBtn");
  const candidatesOutput = safeEl("candidatesOutput");
  const optionsOutput = safeEl("optionsOutput");

  const minPrice = safeEl("minPrice");
  const maxPrice = safeEl("maxPrice");
  const applyFilter = safeEl("applyFilter");

  const showAll = safeEl("showAll");
  const showCalls = safeEl("showCalls");
  const showPuts = safeEl("showPuts");

  const scannerToggle = safeEl("scannerToggle");
  const scannerStatus = safeEl("scannerStatus");

  /* ===== RENDER CANDIDATES ===== */
  function renderCandidates(data) {
    if (!candidatesOutput) return;

    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates returned";
      return;
    }

    let html = `<table><tr><th>Symbol</th><th>Price</th></tr>`;
    data.forEach(c => {
      html += `
        <tr>
          <td><a href="#" class="symbol-link" data-symbol="${c.symbol}">${c.symbol}</a></td>
          <td>${c.price}</td>
        </tr>`;
    });
    html += "</table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        loadOptions(link.dataset.symbol);
      };
    });
  }

  /* ===== LOAD OPTIONS ===== */
  async function loadOptions(symbol) {
    if (!optionsOutput) return;

    optionsOutput.innerHTML = `Loading options for ${symbol}...`;

    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
      const data = await res.json();
      optionsCache = Array.isArray(data.options) ? data.options : [];
      renderOptions();
    } catch (err) {
      optionsOutput.innerHTML = "Failed to load options";
      console.error(err);
    }
  }

  /* ===== RENDER OPTIONS ===== */
  function renderOptions() {
    if (!optionsOutput) return;

    const filtered = currentFilter === "all"
      ? optionsCache
      : optionsCache.filter(o => o && o.type === currentFilter);

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options";
      return;
    }

    let html = `<table>
      <tr><th>Type</th><th>Strike</th><th>Exp</th><th>Ask</th></tr>`;

    filtered.slice(0, 20).forEach(o => {
      const type = (o.type || "").toUpperCase() || "N/A";
      html += `
        <tr>
          <td>${type}</td>
          <td>${o.strike ?? "-"}</td>
          <td>${o.expiration ?? "-"}</td>
          <td>${o.ask ?? "-"}</td>
        </tr>`;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;
  }

  /* ===== FILTER BUTTONS ===== */
  if (showAll) showAll.onclick = () => { currentFilter = "all"; renderOptions(); };
  if (showCalls) showCalls.onclick = () => { currentFilter = "call"; renderOptions(); };
  if (showPuts) showPuts.onclick = () => { currentFilter = "put"; renderOptions(); };

  /* ===== LOAD CANDIDATES ===== */
  if (candidatesBtn) {
    candidatesBtn.onclick = async () => {
      if (candidatesOutput) candidatesOutput.innerHTML = "Loading candidates...";

      try {
        const res = await fetch(`${API_BASE}/api/v1/candidates`);
        const data = await res.json();

        const newData = Array.isArray(data.candidates) ? data.candidates : [];

        runScanner(newData);

        previousPrices = Object.fromEntries(
          newData.map(c => [c.symbol, c.price])
        );

        candidatesCache = newData;
        renderCandidates(candidatesCache);
      } catch (err) {
        if (candidatesOutput) candidatesOutput.innerHTML = "Failed to load candidates";
        console.error(err);
      }
    };
  }

  /* ===== PRICE FILTER ===== */
  if (applyFilter) {
    applyFilter.onclick = () => {
      const min = Number(minPrice?.value) || 0;
      const max = Number(maxPrice?.value) || Infinity;

      renderCandidates(
        candidatesCache.filter(c => c.price >= min && c.price <= max)
      );
    };
  }

  /* ===== SCANNER TOGGLE ===== */
  if (scannerToggle) {
    scannerToggle.onclick = () => {
      scannerRunning = !scannerRunning;

      if (scannerRunning) {
        if (scannerStatus) scannerStatus.textContent = "Running (60s)";
        scannerToggle.textContent = "⏸ Stop Scanner";
        scannerInterval = setInterval(() => candidatesBtn?.click(), 60000);
        logScanner("Scanner started");
      } else {
        clearInterval(scannerInterval);
        if (scannerStatus) scannerStatus.textContent = "Stopped";
        scannerToggle.textContent = "▶ Start Scanner";
        logScanner("Scanner stopped");
      }
    };
  }

  renderAlerts();
});
