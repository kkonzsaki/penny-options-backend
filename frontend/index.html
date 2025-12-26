console.log("Frontend loaded");

let chart = null;
let alerts = JSON.parse(localStorage.getItem("alerts") || "[]");

/* ===========================
   THEME TOGGLE
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
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let optionsCache = [];
let currentFilter = "all";

/* ===========================
   ALERTS
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

function checkAlerts(symbol, price, prevPrice) {
  alerts = alerts.filter(a => {
    if (a.symbol !== symbol) return true;

    if (a.type === "above" && price >= a.value) {
      alert(`🔔 ${symbol} ABOVE ${a.value}`);
      return false;
    }
    if (a.type === "below" && price <= a.value) {
      alert(`🔔 ${symbol} BELOW ${a.value}`);
      return false;
    }

    if (prevPrice) {
      const pct = ((price - prevPrice) / prevPrice) * 100;
      if (a.type === "percent_up" && pct >= a.value) {
        alert(`📈 ${symbol} UP ${pct.toFixed(2)}%`);
        return false;
      }
      if (a.type === "percent_down" && pct <= -a.value) {
        alert(`📉 ${symbol} DOWN ${pct.toFixed(2)}%`);
        return false;
      }
    }
    return true;
  });

  saveAlerts();
  renderAlerts();
}

/* ===========================
   DOM READY
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

  const alertSymbol = document.getElementById("alertSymbol");
  const alertType = document.getElementById("alertType");
  const alertValue = document.getElementById("alertValue");
  const addAlert = document.getElementById("addAlert");

  function renderCandidates(data) {
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

  async function loadOptions(symbol) {
    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
    const data = await res.json();
    optionsCache = data.options || [];
    renderOptions();
  }

  function renderOptions() {
    let filtered = currentFilter === "all"
      ? optionsCache
      : optionsCache.filter(o => o.type === currentFilter);

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
    const prev = Object.fromEntries(candidatesCache.map(c => [c.symbol, c.price]));

    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];

    candidatesCache.forEach(c => {
      checkAlerts(c.symbol, c.price, prev[c.symbol]);
    });

    renderCandidates(candidatesCache);
  };

  applyFilter.onclick = () => {
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Infinity;
    renderCandidates(candidatesCache.filter(c => c.price >= min && c.price <= max));
  };

  addAlert.onclick = () => {
    if (!alertSymbol.value || !alertValue.value) return;

    alerts.push({
      symbol: alertSymbol.value.toUpperCase(),
      type: alertType.value,
      value: Number(alertValue.value)
    });

    saveAlerts();
    renderAlerts();
    alertSymbol.value = alertValue.value = "";
  };

  renderAlerts();
});
