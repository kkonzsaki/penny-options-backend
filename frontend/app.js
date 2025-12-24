console.log("Frontend loaded");

/* ===========================
   SAFETY
=========================== */
if (typeof API_BASE === "undefined") {
  console.error("❌ API_BASE is not defined (check config.js)");
}

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentPrice = null;
let selectedOption = null;

let optionTypeFilter = "call"; // call | put
let maxAskFilter = null;
let expirationFilter = "ALL";

let watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
let savedTrades = JSON.parse(localStorage.getItem("savedTrades") || "[]");
let priceAlerts = JSON.parse(localStorage.getItem("priceAlerts") || "[]");

/* ===========================
   STORAGE
=========================== */
function saveState() {
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  localStorage.setItem("savedTrades", JSON.stringify(savedTrades));
  localStorage.setItem("priceAlerts", JSON.stringify(priceAlerts));
}

/* ===========================
   ALERTS
=========================== */
function checkAlerts(symbol, price) {
  priceAlerts.forEach(a => {
    if (
      a.symbol === symbol &&
      ((a.type === "above" && price >= a.price) ||
       (a.type === "below" && price <= a.price))
    ) {
      alert(`🔔 ALERT: ${symbol} ${price}`);
      a.triggered = true;
    }
  });

  priceAlerts = priceAlerts.filter(a => !a.triggered);
  saveState();
}

/* ===========================
   WATCHLIST
=========================== */
function renderWatchlist() {
  const out = document.getElementById("watchlistOutput");
  if (!out) return;

  out.innerHTML =
    watchlist.length === 0
      ? "Watchlist empty"
      : watchlist.map(s => `<div>${s}</div>`).join("");
}

/* ===========================
   CANDIDATES
=========================== */
function renderCandidates(data) {
  const out = document.getElementById("candidatesOutput");

  if (!data.length) {
    out.innerHTML = "No candidates found";
    return;
  }

  let html = `
    <table>
      <tr><th>Symbol</th><th>Price</th><th>⭐</th><th>⏰</th></tr>
  `;

  data.forEach(c => {
    html += `
      <tr>
        <td>
          <a href="#" class="symbol-link"
             data-symbol="${c.symbol}"
             data-price="${c.price}">
             ${c.symbol}
          </a>
        </td>
        <td>${c.price}</td>
        <td><button class="add-watch" data-symbol="${c.symbol}">⭐</button></td>
        <td><button class="add-alert" data-symbol="${c.symbol}" data-price="${c.price}">⏰</button></td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".symbol-link").forEach(l => {
    l.onclick = loadOptionsChain;
  });

  document.querySelectorAll(".add-watch").forEach(b => {
    b.onclick = () => {
      if (!watchlist.includes(b.dataset.symbol)) {
        watchlist.push(b.dataset.symbol);
        saveState();
        renderWatchlist();
      }
    };
  });

  document.querySelectorAll(".add-alert").forEach(b => {
    b.onclick = () => {
      const price = prompt("Alert price?");
      if (!price) return;

      const type = confirm("OK = ABOVE, Cancel = BELOW") ? "above" : "below";
      priceAlerts.push({
        symbol: b.dataset.symbol,
        price: parseFloat(price),
        type
      });

      saveState();
    };
  });
}

/* ===========================
   OPTIONS FILTER + RENDER
=========================== */
function renderOptions() {
  const out = document.getElementById("optionsOutput");
  if (!currentOptions.length) {
    out.innerHTML = "No options loaded";
    return;
  }

  let filtered = currentOptions.filter(o => {
    if (optionTypeFilter && o.type !== optionTypeFilter) return false;
    if (expirationFilter !== "ALL" && o.expiration !== expirationFilter) return false;
    if (maxAskFilter !== null && o.ask > maxAskFilter) return false;
    return true;
  });

  if (!filtered.length) {
    out.innerHTML = "No options match filters";
    return;
  }

  let html = `
    <table>
      <tr><th>Type</th><th>Strike</th><th>Exp</th><th>Ask</th></tr>
  `;

  filtered.slice(0, 20).forEach((o, i) => {
    html += `
      <tr class="opt" data-i="${i}" style="cursor:pointer">
        <td>${o.type}</td>
        <td>${o.strike}</td>
        <td>${o.expiration}</td>
        <td>${o.ask}</td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;
}

/* ===========================
   OPTIONS LOAD
=========================== */
async function loadOptionsChain(e) {
  e.preventDefault();

  currentSymbol = e.target.dataset.symbol;
  currentPrice = parseFloat(e.target.dataset.price);

  checkAlerts(currentSymbol, currentPrice);

  const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
  const data = await res.json();

  currentOptions = data.options || [];

  // Populate expiration dropdown
  const expSelect = document.getElementById("expirationSelect");
  const expirations = [...new Set(currentOptions.map(o => o.expiration))];

  expSelect.innerHTML =
    `<option value="ALL">All Expirations</option>` +
    expirations.map(e => `<option value="${e}">${e}</option>`).join("");

  renderOptions();
}

/* ===========================
   MAIN
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const minInput = document.getElementById("minPrice");
  const maxInput = document.getElementById("maxPrice");
  const applyFilter = document.getElementById("applyFilter");

  const callsBtn = document.getElementById("callsBtn");
  const putsBtn = document.getElementById("putsBtn");
  const maxAskInput = document.getElementById("maxAsk");
  const expSelect = document.getElementById("expirationSelect");

  candidatesBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  applyFilter.onclick = () => {
    const min = parseFloat(minInput.value || 0);
    const max = parseFloat(maxInput.value || Infinity);
    renderCandidates(candidatesCache.filter(c => c.price >= min && c.price <= max));
  };

  callsBtn.onclick = () => {
    optionTypeFilter = "call";
    callsBtn.classList.add("active");
    putsBtn.classList.remove("active");
    renderOptions();
  };

  putsBtn.onclick = () => {
    optionTypeFilter = "put";
    putsBtn.classList.add("active");
    callsBtn.classList.remove("active");
    renderOptions();
  };

  maxAskInput.oninput = () => {
    maxAskFilter = maxAskInput.value ? parseFloat(maxAskInput.value) : null;
    renderOptions();
  };

  expSelect.onchange = () => {
    expirationFilter = expSelect.value;
    renderOptions();
  };

  renderWatchlist();
});
