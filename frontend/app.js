console.log("Frontend loaded");

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let previousPrices = {};
let optionsCache = [];
let currentFilter = "all";
let payoffChart = null;

let alerts = JSON.parse(localStorage.getItem("alerts") || "[]");

/* ===========================
   SCANNER STATE
=========================== */
let scannerRunning = false;
let scannerInterval = null;

/* ===========================
   THEME
=========================== */
document.addEventListener("DOMContentLoaded", () => {
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
});

/* ===========================
   ALERT STORAGE
=========================== */
function saveAlerts() {
  localStorage.setItem("alerts", JSON.stringify(alerts));
}

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

    if (pct >= 5) logScanner(`🚀 ${c.symbol} +${pct.toFixed(2)}%`);
    if (pct <= -5) logScanner(`📉 ${c.symbol} ${pct.toFixed(2)}%`);
    if (c.price <= 1) logScanner(`💸 ${c.symbol} under $1`);
    if (Math.abs(pct) >= 8) logScanner(`⚡ ${c.symbol} volatile`);
  });
}

/* ===========================
   PAYOFF CHART
=========================== */
function renderPayoffChart(option) {
  const ctx = document.getElementById("payoffChart").getContext("2d");

  const prices = [];
  const payoff = [];

  for (let p = option.strike * 0.5; p <= option.strike * 1.5; p += 0.5) {
    prices.push(p.toFixed(2));
    payoff.push(
      option.type === "call"
        ? Math.max(0, p - option.strike) - option.ask
        : Math.max(0, option.strike - p) - option.ask
    );
  }

  if (payoffChart) payoffChart.destroy();

  payoffChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: prices,
      datasets: [{
        label: "Payoff",
        data: payoff,
        borderWidth: 2,
        fill: false
      }]
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

  /* ---------- Candidates ---------- */
  function renderCandidates(data) {
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates found";
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

  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      const data = await res.json();

      const newData = data.candidates || [];
      runScanner(newData);

      previousPrices = Object.fromEntries(
        newData.map(c => [c.symbol, c.price])
      );

      candidatesCache = newData;
      renderCandidates(newData);
    } catch (err) {
      console.error(err);
      candidatesOutput.innerHTML = "❌ Failed to load candidates";
    }
  };

  applyFilter.onclick = () => {
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Infinity;
    renderCandidates(
      candidatesCache.filter(c => c.price >= min && c.price <= max)
    );
  };

  /* ---------- Options ---------- */
  async function loadOptions(symbol) {
    optionsOutput.innerHTML = `Loading options for ${symbol}...`;
    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
      const data = await res.json();
      optionsCache = data.options || [];
      currentFilter = "all";
      renderOptions();
    } catch {
      optionsOutput.innerHTML = "❌ Options not available";
    }
  }

  function renderOptions() {
    let filtered = currentFilter === "all"
      ? optionsCache
      : optionsCache.filter(o => o.type === currentFilter);

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options found";
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

    renderPayoffChart(filtered[0]);
  }

  showAll.onclick = () => { currentFilter = "all"; renderOptions(); };
  showCalls.onclick = () => { currentFilter = "call"; renderOptions(); };
  showPuts.onclick = () => { currentFilter = "put"; renderOptions(); };

  /* ---------- Scanner ---------- */
  scannerToggle.onclick = () => {
    scannerRunning = !scannerRunning;

    if (scannerRunning) {
      scannerToggle.textContent = "⏸ Stop Scanner";
      scannerStatus.textContent = "Running (60s)";
      logScanner("Scanner started");

      scannerInterval = setInterval(() => {
        candidatesBtn.click();
      }, 60000);
    } else {
      clearInterval(scannerInterval);
      scannerInterval = null;
      scannerToggle.textContent = "▶ Start Scanner";
      scannerStatus.textContent = "Stopped";
      logScanner("Scanner stopped");
    }
  };

  renderAlerts();
});
