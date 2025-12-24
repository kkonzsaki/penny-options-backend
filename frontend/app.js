console.log("Frontend loaded");

/* ===========================
   CONFIG SAFETY
=========================== */
if (typeof API_BASE === "undefined") {
  console.error("❌ API_BASE is not defined. Check config.js");
}

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentPrice = null;
let selectedOption = null;

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
   ALERT CHECK
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
  renderAlerts();
}

/* ===========================
   ALERTS RENDER
=========================== */
function renderAlerts() {
  const out = document.getElementById("alertsOutput");
  if (!out) return;

  if (priceAlerts.length === 0) {
    out.innerHTML = "No alerts set";
    return;
  }

  let html = `<table><tr><th>Symbol</th><th>Condition</th></tr>`;
  priceAlerts.forEach(a => {
    html += `<tr><td>${a.symbol}</td><td>${a.type} ${a.price}</td></tr>`;
  });
  html += "</table>";

  out.innerHTML = html;
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
   CANDIDATE RENDER
=========================== */
function renderCandidates(data) {
  const out = document.getElementById("candidatesOutput");

  if (!data.length) {
    out.innerHTML = "No candidates found";
    return;
  }

  let html = `
    <table>
      <tr>
        <th>Symbol</th>
        <th>Price</th>
        <th>⭐</th>
        <th>⏰</th>
      </tr>
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
      renderAlerts();
    };
  });
}

/* ===========================
   OPTIONS CHAIN
=========================== */
async function loadOptionsChain(e) {
  e.preventDefault();

  currentSymbol = e.target.dataset.symbol;
  currentPrice = parseFloat(e.target.dataset.price);

  checkAlerts(currentSymbol, currentPrice);

  const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
  const data = await res.json();
  currentOptions = data.options || [];

  const out = document.getElementById("optionsOutput");
  out.innerHTML = `
    <table>
      <tr><th>Type</th><th>Strike</th><th>Exp</th><th>Ask</th></tr>
      ${currentOptions.slice(0, 10).map(o => `
        <tr>
          <td>${o.type}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

/* ===========================
   MAIN
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("candidatesBtn");
  const minInput = document.getElementById("minPrice");
  const maxInput = document.getElementById("maxPrice");
  const applyFilter = document.getElementById("applyFilter");

  btn.onclick = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      const data = await res.json();
      candidatesCache = data.candidates || [];
      renderCandidates(candidatesCache);
    } catch (err) {
      console.error("❌ Failed to load candidates", err);
    }
  };

  applyFilter.onclick = () => {
    const min = parseFloat(minInput.value || 0);
    const max = parseFloat(maxInput.value || Infinity);

    const filtered = candidatesCache.filter(c =>
      c.price >= min && c.price <= max
    );

    renderCandidates(filtered);
  };

  renderWatchlist();
  renderAlerts();
});
