console.log("Frontend loaded");

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let optionsCache = [];
let currentFilter = "all";
let currentSymbol = null;
let optionsRefreshTimer = null;
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
   PAYOFF CHART
=========================== */
function renderPayoffChart(option) {
  const canvas = document.getElementById("payoffChart");
  if (!canvas) return;

  const strike = Number(option.strike);
  const ask = Number(option.ask);
  const isCall = option.type === "call";

  const prices = [];
  const payoff = [];

  for (let p = strike * 0.6; p <= strike * 1.4; p += strike * 0.05) {
    prices.push(p.toFixed(2));

    let value = isCall
      ? Math.max(p - strike, 0) - ask
      : Math.max(strike - p, 0) - ask;

    payoff.push(value.toFixed(2));
  }

  if (payoffChart) payoffChart.destroy();

  payoffChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: prices,
      datasets: [{
        label: option.type.toUpperCase() + " Payoff",
        data: payoff,
        borderColor: isCall ? "#22c55e" : "#ef4444",
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
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

   const scannerToggle = document.getElementById("scannerToggle");
const scannerStatus = document.getElementById("scannerStatus");
const scannerLog = document.getElementById("scannerLog");

scannerToggle.onclick = () => {
  if (scannerRunning) {
    stopScanner();
  } else {
    startScanner();
  }
};

function startScanner() {
  scannerRunning = true;
  scannerStatus.textContent = "Running";
  scannerToggle.textContent = "⏸ Stop Scanner";

  runScanner();
  scannerTimer = setInterval(runScanner, SCANNER_INTERVAL_MS);
}

function stopScanner() {
  scannerRunning = false;
  scannerStatus.textContent = "Stopped";
  scannerToggle.textContent = "▶ Start Scanner";

  if (scannerTimer) clearInterval(scannerTimer);
}

async function runScanner() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();

    const timestamp = new Date().toLocaleTimeString();

    scannerLog.innerHTML =
      `<div>[${timestamp}] Found ${data.candidates?.length || 0} candidates</div>` +
      scannerLog.innerHTML;

  } catch (err) {
    scannerLog.innerHTML =
      `<div style="color:red">Scanner error</div>` +
      scannerLog.innerHTML;
  }
}


  /* =======================
     RENDER CANDIDATES
  ======================= */
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

  /* =======================
     LOAD OPTIONS + AUTO REFRESH
  ======================= */
  async function loadOptions(symbol) {
    currentSymbol = symbol;
    optionsOutput.innerHTML = `Loading options for ${symbol}...`;

    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
      const data = await res.json();

      optionsCache = (data.options || []).map(o => ({
        type:
          o.type?.toLowerCase() ||
          o.optionType?.toLowerCase() ||
          (o.callPut === "C" ? "call" : "put"),
        strike: o.strike,
        expiration: o.expiration || o.exp,
        ask: o.ask
      }));

      currentFilter = "all";
      renderOptions();

      // 🔁 AUTO REFRESH (every 30s)
      if (optionsRefreshTimer) clearInterval(optionsRefreshTimer);
      optionsRefreshTimer = setInterval(() => {
        if (currentSymbol) loadOptions(currentSymbol);
      }, 30000);

    } catch (err) {
      console.error(err);
      optionsOutput.innerHTML = "Option chain failed to load";
    }
  }

  /* =======================
     RENDER OPTIONS
  ======================= */
  function renderOptions() {
    let filtered =
      currentFilter === "all"
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
        <tr class="${o.type}">
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
      row.onclick = () => renderPayoffChart(filtered[i - 1]);
    });
  }

  showAll.onclick = () => { currentFilter = "all"; renderOptions(); };
  showCalls.onclick = () => { currentFilter = "call"; renderOptions(); };
  showPuts.onclick = () => { currentFilter = "put"; renderOptions(); };

  /* =======================
     LOAD CANDIDATES
  ======================= */
  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      const data = await res.json();
      candidatesCache = data.candidates || [];
      renderCandidates(candidatesCache);
    } catch (err) {
      candidatesOutput.innerHTML = "Failed to load candidates";
    }
  };

  applyFilter.onclick = () => {
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Infinity;

    renderCandidates(
      candidatesCache.filter(c => c.price >= min && c.price <= max)
    );
  };
});
