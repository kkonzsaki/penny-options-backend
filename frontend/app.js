console.log("Frontend loaded");

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let previousPrices = {};
let optionsCache = [];
let currentFilter = "all";

let alerts = JSON.parse(localStorage.getItem("alerts") || "[]");
let payoffChart = null;

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
   PAYOFF CHART
=========================== */
function renderPayoffChart(option) {
  const ctx = document.getElementById("payoffChart");
  if (!ctx) return;

  const prices = [];
  const payoff = [];

  const strike = option.strike;
  const ask = option.ask;
  const isCall = option.type === "call";

  for (let p = strike * 0.5; p <= strike * 1.5; p += strike * 0.05) {
    prices.push(p.toFixed(2));

    let value;
    if (isCall) {
      value = Math.max(p - strike, 0) - ask;
    } else {
      value = Math.max(strike - p, 0) - ask;
    }

    payoff.push(value.toFixed(2));
  }

  if (payoffChart) payoffChart.destroy();

  payoffChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: prices,
      datasets: [{
        label: `${option.type.toUpperCase()} Payoff`,
        data: payoff,
        borderWidth: 2,
        tension: 0.3,
        borderColor: isCall ? "#22c55e" : "#ef4444"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: { title: { display: true, text: "Stock Price" }},
        y: { title: { display: true, text: "Profit / Loss ($)" }}
      }
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

  const addAlertBtn = document.getElementById("addAlert");

  /* ===== Candidates ===== */
  function renderCandidates(data) {
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates found";
      return;
    }

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

  /* ===== Options ===== */
  async function loadOptions(symbol) {
    optionsOutput.innerHTML = `Loading options for ${symbol}...`;

    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
      const data = await res.json();
      optionsCache = data.options || [];
      currentFilter = "all";
      renderOptions();
    } catch (err) {
      optionsOutput.innerHTML = "Failed to load options";
      console.error(err);
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
      <tr><th>Type</th><th>Strike</th><th>Expiration</th><th>Ask</th></tr>`;

    filtered.slice(0, 20).forEach(o => {
      html += `
        <tr class="${o.type}" data-strike="${o.strike}">
          <td>${o.type.toUpperCase()}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
        </tr>`;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;

    optionsOutput.querySelectorAll("tr").forEach((row, i) => {
      if (i === 0) return;
      row.onclick = () => {
        const option = filtered[i - 1];
        renderPayoffChart(option);
      };
    });
  }

  showAll.onclick = () => { currentFilter = "all"; renderOptions(); };
  showCalls.onclick = () => { currentFilter = "call"; renderOptions(); };
  showPuts.onclick = () => { currentFilter = "put"; renderOptions(); };

  /* ===== Load Candidates ===== */
  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      const data = await res.json();

      candidatesCache = data.candidates || [];

      previousPrices = Object.fromEntries(
        candidatesCache.map(c => [c.symbol, c.price])
      );

      renderCandidates(candidatesCache);
    } catch (err) {
      candidatesOutput.innerHTML = "Failed to load candidates";
      console.error(err);
    }
  };

  /* ===== Price Filter ===== */
  applyFilter.onclick = () => {
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Infinity;

    renderCandidates(
      candidatesCache.filter(c => c.price >= min && c.price <= max)
    );
  };

  /* ===== Alerts Add ===== */
  addAlertBtn.onclick = () => {
    const symbol = document.getElementById("alertSymbol").value.toUpperCase();
    const type = document.getElementById("alertType").value;
    const value = Number(document.getElementById("alertValue").value);

    if (!symbol || !value) {
      alert("Invalid alert");
      return;
    }

    alerts.push({ symbol, type, value });
    saveAlerts();
    renderAlerts();
  };

  renderAlerts();
});
