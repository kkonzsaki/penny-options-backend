console.log("App loaded");

/* ======================
   STATE
====================== */
let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentPrice = null;
let selectedOption = null;

let optionType = "call";
let expiration = "ALL";
let maxAskFilter = null;

let savedTrades = JSON.parse(localStorage.getItem("savedTrades") || "[]");

/* ======================
   STORAGE
====================== */
function saveTrades() {
  localStorage.setItem("savedTrades", JSON.stringify(savedTrades));
  renderSavedTrades();
}

/* ======================
   PROFIT CALCULATOR
====================== */
function renderTradeBuilder() {
  const out = document.getElementById("tradeBuilder");
  if (!selectedOption || !currentPrice) {
    out.innerHTML = "";
    return;
  }

  const { strike, ask, type, expiration } = selectedOption;
  const cost = ask * 100;

  out.innerHTML = `
    <h3>Trade Builder</h3>
    <p><b>${currentSymbol} ${type.toUpperCase()}</b></p>
    <p>Strike: $${strike}</p>
    <p>Ask: $${ask}</p>
    <p>Cost: $${cost.toFixed(2)}</p>

    <label>Contracts:
      <input type="number" id="contracts" value="1" min="1" />
    </label>

    <button id="saveTrade">Save Trade</button>

    <input type="range" id="priceSlider"
      min="0"
      max="${(currentPrice * 3).toFixed(2)}"
      step="0.01"
      value="${currentPrice}" />

    <p>Price: $<span id="priceVal">${currentPrice}</span></p>
    <p>P/L: <span id="plVal"></span></p>
  `;

  const slider = document.getElementById("priceSlider");
  const priceVal = document.getElementById("priceVal");
  const plVal = document.getElementById("plVal");

  function calcPL(price) {
    const intrinsic =
      type === "call"
        ? Math.max(price - strike, 0)
        : Math.max(strike - price, 0);

    return intrinsic * 100 - cost;
  }

  function updatePL(price) {
    const pl = calcPL(price);
    plVal.textContent = pl >= 0 ? `+$${pl.toFixed(2)}` : `-$${Math.abs(pl).toFixed(2)}`;
    plVal.className = pl >= 0 ? "profit" : "loss";
  }

  slider.oninput = () => {
    priceVal.textContent = slider.value;
    updatePL(parseFloat(slider.value));
  };

  updatePL(currentPrice);

  document.getElementById("saveTrade").onclick = () => {
    const contracts = parseInt(document.getElementById("contracts").value);

    savedTrades.push({
      symbol: currentSymbol,
      type,
      strike,
      expiration,
      ask,
      contracts
    });

    saveTrades();
  };
}

/* ======================
   SAVED TRADES
====================== */
function renderSavedTrades() {
  const out = document.getElementById("savedTrades");
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
        <th>Contracts</th>
        <th>Remove</th>
      </tr>
  `;

  savedTrades.forEach((t, i) => {
    html += `
      <tr>
        <td>${t.symbol}</td>
        <td>${t.type}</td>
        <td>${t.strike}</td>
        <td>${t.ask}</td>
        <td>${t.contracts}</td>
        <td><button data-i="${i}">X</button></td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  out.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      savedTrades.splice(btn.dataset.i, 1);
      saveTrades();
    };
  });
}

/* ======================
   OPTIONS
====================== */
function renderOptions() {
  const out = document.getElementById("optionsOutput");

  const filtered = currentOptions.filter(o => {
    if (o.type !== optionType) return false;
    if (expiration !== "ALL" && o.expiration !== expiration) return false;
    if (maxAskFilter && o.ask > maxAskFilter) return false;
    return true;
  });

  if (!filtered.length) {
    out.innerHTML = "No options match filters";
    return;
  }

  let html = `
    <table>
      <tr>
        <th>Type</th>
        <th>Strike</th>
        <th>Exp</th>
        <th>Ask</th>
      </tr>
  `;

  filtered.slice(0, 15).forEach((o, i) => {
    html += `
      <tr class="opt" data-i="${i}">
        <td>${o.type}</td>
        <td>${o.strike}</td>
        <td>${o.expiration}</td>
        <td>${o.ask}</td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".opt").forEach((r, i) => {
    r.onclick = () => {
      selectedOption = filtered[i];
      renderTradeBuilder();
    };
  });
}

/* ======================
   LOAD OPTIONS
====================== */
async function loadOptionsChain(e) {
  e.preventDefault();
  currentSymbol = e.target.dataset.symbol;
  currentPrice = parseFloat(e.target.dataset.price);

  const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
  const data = await res.json();
  currentOptions = data.options || [];

  const exps = [...new Set(currentOptions.map(o => o.expiration))];
  expirationSelect.innerHTML =
    `<option value="ALL">All Expirations</option>` +
    exps.map(e => `<option value="${e}">${e}</option>`).join("");

  renderOptions();
}

/* ======================
   CANDIDATES
====================== */
function renderCandidates(list) {
  const out = document.getElementById("candidatesOutput");

  let html = `<table><tr><th>Symbol</th><th>Price</th></tr>`;
  list.forEach(c => {
    html += `
      <tr>
        <td><a href="#" class="symbol-link" data-symbol="${c.symbol}" data-price="${c.price}">${c.symbol}</a></td>
        <td>${c.price}</td>
      </tr>
    `;
  });
  html += "</table>";

  out.innerHTML = html;
  document.querySelectorAll(".symbol-link").forEach(l => l.onclick = loadOptionsChain);
}

/* ======================
   INIT
====================== */
document.addEventListener("DOMContentLoaded", () => {
  renderSavedTrades();

  candidatesBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  applyFilter.onclick = () => {
    const min = parseFloat(minPrice.value || 0);
    const max = parseFloat(maxPrice.value || Infinity);
    renderCandidates(candidatesCache.filter(c => c.price >= min && c.price <= max));
  };

  callsBtn.onclick = () => {
    optionType = "call";
    callsBtn.classList.add("active");
    putsBtn.classList.remove("active");
    renderOptions();
  };

  putsBtn.onclick = () => {
    optionType = "put";
    putsBtn.classList.add("active");
    callsBtn.classList.remove("active");
    renderOptions();
  };

  maxAsk.oninput = () => {
    maxAskFilter = maxAsk.value ? parseFloat(maxAsk.value) : null;
    renderOptions();
  };

  expirationSelect.onchange = () => {
    expiration = expirationSelect.value;
    renderOptions();
  };
});
