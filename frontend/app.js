console.log("Frontend loaded");

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
   THEME
=========================== */
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme") || "dark";

if (savedTheme === "light") {
  document.body.classList.add("light");
  themeToggle.textContent = "☀️ Light";
}

themeToggle.onclick = () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  themeToggle.textContent = isLight ? "☀️ Light" : "🌙 Dark";
};

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
  const out = document.getElementById("alertsOutput");
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
  const log = document.getElementById("scannerLog");
  const time = new Date().toLocaleTimeString();
  log.innerHTML = `<div>[${time}] ${msg}</div>` + log.innerHTML;
}

/* ===========================
   SCANNER RULES
=========================== */
function runScanner(newCandidates) {
  newCandidates.forEach(c => {
    const prev = previousPrices[c.symbol];
    if (!prev) return;

    const pct = ((c.price - prev) / prev) * 100;

    if (pct >= 5) {
      alert(`🚀 ${c.symbol} UP ${pct.toFixed(2)}%`);
      logScanner(`🚀 ${c.symbol} UP ${pct.toFixed(2)}%`);
    }

    if (pct <= -5) {
      alert(`📉 ${c.symbol} DOWN ${pct.toFixed(2)}%`);
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
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const optionsOutput = document.getElementById("optionsOutput");

  const minPrice = document.getElementById("minPrice");
  const maxPrice = document.getElementById("maxPrice");
  const applyFilter = document.getElementById("applyFilter");

  const showAll = document.getElementById("showAll");
  const showCalls = document.getElementById("showCalls");
  const showPuts = document.getElementById("showPuts");

  const scannerToggle = document.getElementById("scannerToggle");
  const scannerStatus = document.getElementById("scannerStatus");

  function renderCandidates(data) {
    let html = `<table><tr><th>Symbol</th><th>Price</th></tr>`;
    data.forEach(c => {
      html += `
        <tr>
          <td>
            <a href="#" class="symbol-link" data-symbol="${c.symbol}">
              ${c.symbol}
            </a>
          </td>
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

  async function loadOptions(symbol) {
    optionsOutput.innerHTML = `Loading options for ${symbol}...`;
    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
    const data = await res.json();
    optionsCache = data.options || [];
    renderOptions();
  }

  function renderOptions() {
    let filtered = currentFilter === "all"
      ? optionsCache
      : optionsCache.filter(o => o.type === currentFilter);

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options";
      return;
    }

    let html = `<table>
      <tr><th>Type</th><th>Strike</th><th>Exp</th><th>Ask</th></tr>`;

    filtered.slice(0, 20).forEach(o => {
      html += `
        <tr class="${o.type}">
          <td>${o.type.toUpperCase()}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
        </tr>`;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;
  }

  showAll.onclick = () => { currentFilter = "all"; renderOptions(); };
  showCalls.onclick = () => { currentFilter = "call"; renderOptions(); };
  showPuts.onclick = () => { currentFilter = "put"; renderOptions(); };

  candidatesBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();

    const newData = data.candidates || [];

    runScanner(newData);

    previousPrices = Object.fromEntries(
      newData.map(c => [c.symbol, c.price])
    );

    candidatesCache = newData;
    renderCandidates(candidatesCache);
  };

  applyFilter.onclick = () => {
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Infinity;
    renderCandidates(
      candidatesCache.filter(c => c.price >= min && c.price <= max)
    );
  };

  scannerToggle.onclick = () => {
    scannerRunning = !scannerRunning;

    if (scannerRunning) {
      scannerStatus.textContent = "Running (60s)";
      scannerToggle.textContent = "⏸ Stop Scanner";

      scannerInterval = setInterval(() => {
        candidatesBtn.click();
      }, 60000);

      logScanner("Scanner started");
    } else {
      clearInterval(scannerInterval);
      scannerStatus.textContent = "Stopped";
      scannerToggle.textContent = "▶ Start Scanner";
      logScanner("Scanner stopped");
    }
  };

  renderAlerts();
});
