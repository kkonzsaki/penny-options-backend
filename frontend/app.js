console.log("Frontend loaded");

/* =====================
   STATE
===================== */
let candidatesCache = [];
let previousPrices = {};
let optionsCache = [];
let currentFilter = "all";
let payoffChart = null;
let scannerInterval = null;
let scannerRunning = false;

let alerts = JSON.parse(localStorage.getItem("alerts") || "[]");

/* =====================
   THEME
===================== */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeToggle");
  const saved = localStorage.getItem("theme") || "dark";

  if (saved === "light") {
    document.body.classList.add("light");
    toggle.textContent = "☀️ Light";
  }

  toggle.onclick = () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    toggle.textContent = isLight ? "☀️ Light" : "🌙 Dark";
  };
});

/* =====================
   ALERTS
===================== */
function saveAlerts() {
  localStorage.setItem("alerts", JSON.stringify(alerts));
}

function renderAlerts() {
  const out = document.getElementById("alertsOutput");
  if (!alerts.length) {
    out.innerHTML = "No alerts set";
    return;
  }

  out.innerHTML = alerts.map((a, i) => `
    <div>
      ${a.symbol} ${a.type} ${a.value}
      <button onclick="removeAlert(${i})">✖</button>
    </div>
  `).join("");
}

window.removeAlert = i => {
  alerts.splice(i, 1);
  saveAlerts();
  renderAlerts();
};

document.getElementById("addAlert").onclick = () => {
  const s = alertSymbol.value.toUpperCase();
  const t = alertType.value;
  const v = Number(alertValue.value);
  if (!s || !v) return;
  alerts.push({ symbol: s, type: t, value: v });
  saveAlerts();
  renderAlerts();
};

/* =====================
   PAYOFF CHART
===================== */
function renderPayoff(option) {
  const ctx = document.getElementById("payoffChart").getContext("2d");
  const x = [];
  const y = [];

  for (let p = option.strike * 0.5; p <= option.strike * 1.5; p += 0.5) {
    x.push(p.toFixed(2));
    y.push(
      option.type === "call"
        ? Math.max(0, p - option.strike) - option.ask
        : Math.max(0, option.strike - p) - option.ask
    );
  }

  if (payoffChart) payoffChart.destroy();

  payoffChart = new Chart(ctx, {
    type: "line",
    data: { labels: x, datasets: [{ label: "Payoff", data: y }] }
  });
}

/* =====================
   MAIN
===================== */
document.getElementById("candidatesBtn").onclick = async () => {
  const out = document.getElementById("candidatesOutput");
  out.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();

    candidatesCache = data.candidates || [];
    previousPrices = Object.fromEntries(
      candidatesCache.map(c => [c.symbol, c.price])
    );

    out.innerHTML = candidatesCache.map(c => `
      <div>
        <a href="#" onclick="loadOptions('${c.symbol}')">${c.symbol}</a>
        $${c.price}
      </div>
    `).join("");
  } catch {
    out.innerHTML = "❌ Failed to load candidates";
  }
};

window.loadOptions = async symbol => {
  const out = document.getElementById("optionsOutput");
  out.innerHTML = "Loading options...";

  try {
    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
    const data = await res.json();
    optionsCache = data.options || [];

    if (!optionsCache.length) {
      out.innerHTML = "No options";
      return;
    }

    const o = optionsCache[0];
    renderPayoff(o);

    out.innerHTML = optionsCache.slice(0, 20).map(o => `
      <div class="${o.type}">
        ${o.type.toUpperCase()} ${o.strike} ${o.expiration} $${o.ask}
      </div>
    `).join("");
  } catch {
    out.innerHTML = "❌ Options unavailable";
  }
};

/* =====================
   SCANNER
===================== */
document.getElementById("scannerToggle").onclick = () => {
  const status = document.getElementById("scannerStatus");
  scannerRunning = !scannerRunning;

  if (scannerRunning) {
    status.textContent = "Running";
    scannerInterval = setInterval(() => {
      document.getElementById("candidatesBtn").click();
    }, 60000);
  } else {
    clearInterval(scannerInterval);
    status.textContent = "Stopped";
  }
};

renderAlerts();
