console.log("Frontend loaded");

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let optionsCache = [];
let currentSymbol = "";
let currentPrice = null;
let selectedOption = null;

let savedTrades = JSON.parse(localStorage.getItem("savedTrades") || "[]");

/* ===========================
   STORAGE
=========================== */
function saveTrades() {
  localStorage.setItem("savedTrades", JSON.stringify(savedTrades));
}

/* ===========================
   RENDER SAVED TRADES
=========================== */
function renderSavedTrades() {
  const out = document.getElementById("savedTradesOutput");
  if (!out) return;

  if (!savedTrades.length) {
    out.innerHTML = "No saved trades";
    return;
  }

  let html = `
    <table>
      <tr>
        <th>Symbol</th>
        <th>Type</th>
        <th>Strike</th>
        <th>Ask</th>
        <th>Cost</th>
        <th>Breakeven</th>
        <th></th>
      </tr>
  `;

  savedTrades.forEach((t, i) => {
    html += `
      <tr>
        <td>${t.symbol}</td>
        <td>${t.type.toUpperCase()}</td>
        <td>${t.strike}</td>
        <td>${t.ask}</td>
        <td>$${t.cost.toFixed(2)}</td>
        <td>$${t.breakeven.toFixed(2)}</td>
        <td><button data-i="${i}" class="removeTrade">✖</button></td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".removeTrade").forEach(btn => {
    btn.onclick = () => {
      savedTrades.splice(btn.dataset.i, 1);
      saveTrades();
      renderSavedTrades();
    };
  });
}

/* ===========================
   TRADE BUILDER
=========================== */
function renderTradeBuilder() {
  const out = document.getElementById("tradeBuilder");
  if (!out || !selectedOption || currentPrice == null) return;

  const ask = selectedOption.ask;
  const strike = selectedOption.strike;
  const cost = ask * 100;

  const breakeven =
    selectedOption.type === "call"
      ? strike + ask
      : strike - ask;

  const pnl =
    selectedOption.type === "call"
      ? (currentPrice - breakeven) * 100
      : (breakeven - currentPrice) * 100;

  out.innerHTML = `
    <h3>Trade Builder</h3>
    <p><b>${currentSymbol}</b> ${selectedOption.type.toUpperCase()}</p>
    <p>Strike: ${strike}</p>
    <p>Ask: $${ask}</p>
    <p>Cost: $${cost.toFixed(2)}</p>
    <p>Breakeven: $${breakeven.toFixed(2)}</p>
    <p>
      P/L at Current Price:
      <span style="color:${pnl >= 0 ? "#22c55e" : "#ef4444"}">
        $${pnl.toFixed(2)}
      </span>
    </p>
    <button id="saveTradeBtn">💾 Save Trade</button>
  `;

  document.getElementById("saveTradeBtn").onclick = () => {
    savedTrades.push({
      symbol: currentSymbol,
      type: selectedOption.type,
      strike,
      ask,
      cost,
      breakeven
    });
    saveTrades();
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
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates";
      return;
    }

    let html = `
      <table>
        <tr><th>Symbol</th><th>Price</th></tr>
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
        </tr>
      `;
    });

    html += "</table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(link => {
      link.onclick = loadOptionsChain;
    });
  }

  async function loadOptionsChain(e) {
    e.preventDefault();
    currentSymbol = e.target.dataset.symbol;
    currentPrice = parseFloat(e.target.dataset.price);
    selectedOption = null;

    optionsOutput.innerHTML = "Loading options…";

    const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
    const data = await res.json();

    let normalized = [];

    if (Array.isArray(data.options)) {
      normalized = data.options.map(o => ({
        ...o,
        type: o.type || "call"
      }));
    } else {
      const calls = (data.calls || []).map(o => ({ ...o, type: "call" }));
      const puts = (data.puts || []).map(o => ({ ...o, type: "put" }));
      normalized = [...calls, ...puts];
    }

    optionsCache = normalized;

    let html = `
      <table>
        <tr><th>Type</th><th>Strike</th><th>Exp</th><th>Ask</th></tr>
    `;

    optionsCache.slice(0, 12).forEach((o, i) => {
      html += `
        <tr class="opt" data-i="${i}" style="cursor:pointer">
          <td>${o.type.toUpperCase()}</td>
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
        selectedOption = optionsCache[r.dataset.i];
        renderTradeBuilder();
      };
    });
  }

  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading…";
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  renderSavedTrades();
});
