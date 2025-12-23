console.log("Frontend loaded");

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

/* ===========================
   STORAGE HELPERS
=========================== */
function saveState() {
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  localStorage.setItem("savedTrades", JSON.stringify(savedTrades));
}

/* ===========================
   WATCHLIST RENDER
=========================== */
function renderWatchlist() {
  const out = document.getElementById("watchlistOutput");
  if (!out) return;

  if (watchlist.length === 0) {
    out.innerHTML = "Watchlist empty";
    return;
  }

  let html = `<table><tr><th>Symbol</th><th></th></tr>`;
  watchlist.forEach((s, i) => {
    html += `
      <tr>
        <td>${s}</td>
        <td><button data-i="${i}" class="remove-watch">✖</button></td>
      </tr>`;
  });
  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".remove-watch").forEach(btn => {
    btn.onclick = () => {
      watchlist.splice(btn.dataset.i, 1);
      saveState();
      renderWatchlist();
    };
  });
}

/* ===========================
   SAVED TRADES RENDER
=========================== */
function renderSavedTrades() {
  const out = document.getElementById("savedTradesOutput");
  if (!out) return;

  if (savedTrades.length === 0) {
    out.innerHTML = "No saved trades";
    return;
  }

  let html = `
    <table>
      <tr>
        <th>Symbol</th><th>Type</th><th>Strike</th>
        <th>Exp</th><th>Cost</th><th></th>
      </tr>
  `;

  savedTrades.forEach((t, i) => {
    html += `
      <tr>
        <td>${t.symbol}</td>
        <td>${t.type}</td>
        <td>${t.strike}</td>
        <td>${t.exp}</td>
        <td>$${t.cost.toFixed(2)}</td>
        <td><button data-i="${i}" class="remove-trade">✖</button></td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".remove-trade").forEach(btn => {
    btn.onclick = () => {
      savedTrades.splice(btn.dataset.i, 1);
      saveState();
      renderSavedTrades();
    };
  });
}

/* ===========================
   TRADE BUILDER
=========================== */
function renderTradeBuilder() {
  const out = document.getElementById("tradeBuilder");
  if (!out || !selectedOption || !currentPrice) return;

  const ask = selectedOption.ask;
  const strike = selectedOption.strike;
  const cost = ask * 100;

  const breakeven =
    selectedOption.type === "call"
      ? strike + ask
      : strike - ask;

  out.innerHTML = `
    <h3>Trade Builder</h3>
    <p><b>${currentSymbol}</b> ${selectedOption.type.toUpperCase()}</p>
    <p>Strike: ${strike}</p>
    <p>Ask: $${ask}</p>
    <p>Cost: $${cost.toFixed(2)}</p>
    <p>Breakeven: $${breakeven.toFixed(2)}</p>
    <button id="saveTradeBtn">💾 Save Trade</button>
  `;

  document.getElementById("saveTradeBtn").onclick = () => {
    savedTrades.push({
      symbol: currentSymbol,
      type: selectedOption.type,
      strike,
      exp: selectedOption.expiration,
      cost
    });
    saveState();
    renderSavedTrades();
  };
}

/* ===========================
   MAIN
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const optionsOutput = document.getElementById("optionsOutput");

  function renderCandidates(data) {
    let html = `
      <table>
        <tr><th>Symbol</th><th>Price</th><th></th></tr>
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
        </tr>
      `;
    });

    html += "</table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(l =>
      l.onclick = loadOptionsChain
    );

    document.querySelectorAll(".add-watch").forEach(b => {
      b.onclick = () => {
        const s = b.dataset.symbol;
        if (!watchlist.includes(s)) watchlist.push(s);
        saveState();
        renderWatchlist();
      };
    });
  }

  async function loadOptionsChain(e) {
    e.preventDefault();
    currentSymbol = e.target.dataset.symbol;
    currentPrice = parseFloat(e.target.dataset.price);
    selectedOption = null;

    const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
    const data = await res.json();
    currentOptions = data.options || [];

    let html = `
      <table>
        <tr><th>Type</th><th>Strike</th><th>Exp</th><th>Ask</th></tr>
    `;

    currentOptions.slice(0, 10).forEach((o, i) => {
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
    optionsOutput.innerHTML = html;

    document.querySelectorAll(".opt").forEach(r => {
      r.onclick = () => {
        selectedOption = currentOptions[r.dataset.i];
        renderTradeBuilder();
      };
    });
  }

  candidatesBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  renderWatchlist();
  renderSavedTrades();
});
