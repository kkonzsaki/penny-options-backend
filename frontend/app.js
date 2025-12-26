console.log("Frontend loaded");

/* ===========================
   CONFIG
=========================== */
const PRICE_REFRESH_MS = 15000;

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
let selectedOption = null;
let currentFilter = "all";
let savedTrades = JSON.parse(localStorage.getItem("trades")) || [];

/* ===========================
   DOM READY
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const optionsOutput = document.getElementById("optionsOutput");
  const tradeBuilder = document.getElementById("tradeBuilder");
  const savedTradesOutput = document.getElementById("savedTradesOutput");

  const minPrice = document.getElementById("minPrice");
  const maxPrice = document.getElementById("maxPrice");
  const applyFilter = document.getElementById("applyFilter");

  const showAll = document.getElementById("showAll");
  const showCalls = document.getElementById("showCalls");
  const showPuts = document.getElementById("showPuts");

  /* ===========================
     CANDIDATES
  =========================== */
  function renderCandidates(data) {
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates";
      return;
    }

    let html = `<table>
      <tr><th>Symbol</th><th>Price</th></tr>`;

    data.forEach(c => {
      html += `
        <tr>
          <td>
            <a href="#" class="symbol-link" data-symbol="${c.symbol}">
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
      link.onclick = e => {
        e.preventDefault();
        loadOptions(link.dataset.symbol);
      };
    });
  }

  /* ===========================
     OPTIONS
  =========================== */
  function renderOptions() {
    let filtered = optionsCache;

    if (currentFilter !== "all") {
      filtered = filtered.filter(o => o.type === currentFilter);
    }

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options found";
      return;
    }

    let html = `<table>
      <tr>
        <th>Type</th>
        <th>Strike</th>
        <th>Expiration</th>
        <th>Ask</th>
      </tr>`;

    filtered.slice(0, 20).forEach(o => {
      const type = (o.type || "").toLowerCase();
      if (!type) return;

      html += `
        <tr class="${type}">
          <td class="${type}">
            <a href="#" class="option-link"
              data-symbol="${o.symbol}"
              data-type="${type}"
              data-strike="${o.strike}"
              data-exp="${o.expiration}"
              data-ask="${o.ask}">
              ${type.toUpperCase()}
            </a>
          </td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
        </tr>
      `;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;

    document.querySelectorAll(".option-link").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        selectOption(link.dataset);
      };
    });
  }

  async function loadOptions(symbol) {
    optionsOutput.innerHTML = `Loading options for ${symbol}...`;
    currentFilter = "all";

    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
    const data = await res.json();
    optionsCache = data.options || [];
    renderOptions();
  }

  /* ===========================
     TRADE BUILDER
  =========================== */
  function selectOption(o) {
    selectedOption = {
      symbol: o.symbol,
      type: o.type,
      strike: Number(o.strike),
      expiration: o.exp,
      entry: Number(o.ask),
      qty: 1,
      current: Number(o.ask)
    };

    renderTradeBuilder();
  }

  function renderTradeBuilder() {
    if (!selectedOption) return;

    tradeBuilder.innerHTML = `
      <h3>Trade Builder</h3>
      <p><strong>${selectedOption.symbol}</strong>
        ${selectedOption.type.toUpperCase()}
        ${selectedOption.strike}
        @ ${selectedOption.entry}</p>

      <label>Contracts:
        <input id="qtyInput" type="number" value="1" min="1">
      </label>

      <button id="saveTrade">Save Trade</button>
    `;

    document.getElementById("saveTrade").onclick = () => {
      const qty = Number(document.getElementById("qtyInput").value);
      selectedOption.qty = qty;
      selectedOption.id = Date.now();
      savedTrades.push({ ...selectedOption });
      persistTrades();
      renderSavedTrades();
    };
  }

  /* ===========================
     LIVE P/L
  =========================== */
  async function refreshPrices() {
    for (let trade of savedTrades) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/options/${trade.symbol}`
        );
        const data = await res.json();

        const match = (data.options || []).find(o =>
          o.type === trade.type &&
          Number(o.strike) === trade.strike &&
          o.expiration === trade.expiration
        );

        if (match) {
          trade.current = Number(match.ask);
        }
      } catch (e) {
        console.warn("Price refresh failed", e);
      }
    }

    persistTrades();
    renderSavedTrades();
  }

  /* ===========================
     SAVED TRADES
  =========================== */
  function renderSavedTrades() {
    if (!savedTrades.length) {
      savedTradesOutput.innerHTML = "No saved trades";
      return;
    }

    let html = `<table>
      <tr>
        <th>Symbol</th>
        <th>Type</th>
        <th>Strike</th>
        <th>Entry</th>
        <th>Current</th>
        <th>P/L</th>
      </tr>`;

    savedTrades.forEach(t => {
      const pnl =
        ((t.current - t.entry) * 100 * t.qty).toFixed(2);
      const cls = pnl >= 0 ? "call" : "put";

      html += `
        <tr>
          <td>${t.symbol}</td>
          <td class="${t.type}">${t.type.toUpperCase()}</td>
          <td>${t.strike}</td>
          <td>${t.entry}</td>
          <td>${t.current}</td>
          <td class="${cls}">$${pnl}</td>
        </tr>
      `;
    });

    html += "</table>";
    savedTradesOutput.innerHTML = html;
  }

  function persistTrades() {
    localStorage.setItem("trades", JSON.stringify(savedTrades));
  }

  /* ===========================
     FILTERS
  =========================== */
  showAll.onclick = () => {
    currentFilter = "all";
    renderOptions();
  };

  showCalls.onclick = () => {
    currentFilter = "call";
    renderOptions();
  };

  showPuts.onclick = () => {
    currentFilter = "put";
    renderOptions();
  };

  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  applyFilter.onclick = () => {
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Infinity;
    renderCandidates(
      candidatesCache.filter(c => c.price >= min && c.price <= max)
    );
  };

  renderSavedTrades();
  setInterval(refreshPrices, PRICE_REFRESH_MS);
});
