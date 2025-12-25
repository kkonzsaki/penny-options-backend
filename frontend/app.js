console.log("Frontend loaded");

/* ===========================
   STATE
=========================== */
let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentPrice = null;
let selectedOption = null;

let optionType = "call";
let expiration = "ALL";
let maxAskFilter = null;

/* ===========================
   PROFIT CALCULATOR
=========================== */
function renderTradeBuilder() {
  const out = document.getElementById("tradeBuilder");
  if (!selectedOption || !currentPrice) {
    out.innerHTML = "";
    return;
  }

  const ask = selectedOption.ask;
  const strike = selectedOption.strike;
  const type = selectedOption.type;

  const breakeven =
    type === "call" ? strike + ask : strike - ask;

  const cost = ask * 100;

  out.innerHTML = `
    <h3>Profit Calculator</h3>
    <p><b>${currentSymbol.toUpperCase()} ${type.toUpperCase()}</b></p>
    <p>Strike: $${strike}</p>
    <p>Ask: $${ask}</p>
    <p>Cost: $${cost.toFixed(2)}</p>
    <p>Breakeven: $${breakeven.toFixed(2)}</p>

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

  function updatePL(price) {
    const intrinsic =
      type === "call"
        ? Math.max(price - strike, 0)
        : Math.max(strike - price, 0);

    const profit = intrinsic * 100 - cost;
    plVal.textContent =
      profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`;
    plVal.className = profit >= 0 ? "profit" : "loss";
  }

  slider.oninput = () => {
    priceVal.textContent = slider.value;
    updatePL(parseFloat(slider.value));
  };

  updatePL(currentPrice);
}

/* ===========================
   OPTIONS RENDER (WITH GREEKS)
=========================== */
function renderOptions() {
  const out = document.getElementById("optionsOutput");

  const filtered = currentOptions.filter(o => {
    if (o.type !== optionType) return false;
    if (expiration !== "ALL" && o.expiration !== expiration) return false;
    if (maxAskFilter !== null && o.ask > maxAskFilter) return false;
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
        <th>Delta</th>
        <th>Theta</th>
        <th>IV</th>
      </tr>
  `;

  filtered.slice(0, 15).forEach((o, i) => {
    const delta = o.delta ?? "—";
    const theta = o.theta ?? "—";
    const iv = o.iv ?? o.impliedVolatility ?? "—";

    html += `
      <tr class="opt" data-i="${i}">
        <td>${o.type}</td>
        <td>${o.strike}</td>
        <td>${o.expiration}</td>
        <td>${o.ask}</td>
        <td class="${delta >= 0 ? "delta-pos" : "delta-neg"}">${delta}</td>
        <td class="theta-neg">${theta}</td>
        <td>${iv}</td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".opt").forEach((row, i) => {
    row.onclick = () => {
      selectedOption = filtered[i];
      renderTradeBuilder();
    };
  });
}

/* ===========================
   LOAD OPTIONS
=========================== */
async function loadOptionsChain(e) {
  e.preventDefault();
  currentSymbol = e.target.dataset.symbol;
  currentPrice = parseFloat(e.target.dataset.price);

  const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
  const data = await res.json();
  currentOptions = data.options || [];

  const expSel = document.getElementById("expirationSelect");
  const exps = [...new Set(currentOptions.map(o => o.expiration))];

  expSel.innerHTML =
    `<option value="ALL">All Expirations</option>` +
    exps.map(e => `<option value="${e}">${e}</option>`).join("");

  renderOptions();
}

/* ===========================
   CANDIDATES
=========================== */
function renderCandidates(list) {
  const out = document.getElementById("candidatesOutput");

  let html = `<table><tr><th>Symbol</th><th>Price</th></tr>`;
  list.forEach(c => {
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

  out.innerHTML = html;
  document.querySelectorAll(".symbol-link").forEach(l => l.onclick = loadOptionsChain);
}

/* ===========================
   MAIN
=========================== */
document.addEventListener("DOMContentLoaded", () => {
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
