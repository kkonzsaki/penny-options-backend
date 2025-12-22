console.log("Frontend loaded");

let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentType = "CALL";
let currentExpiration = "ALL";
let currentPrice = null;
let activeStrategy = "ALL";
let selectedOption = null;

/* ===========================
   OPTION SCORING
=========================== */
function scoreOption(o) {
  const bid = o.bid ?? 0;
  const ask = o.ask ?? 999;
  const spread = ask - bid;
  const volume = o.volume ?? 0;
  const oi = o.openInterest ?? 0;

  if (ask <= 0 || spread < 0) return -999;

  return volume * 0.3 + oi * 0.3 - spread * 2 - ask * 1.5;
}

/* ===========================
   STRATEGY FILTERS
=========================== */
function applyStrategy(options) {
  if (!currentPrice) return options;

  if (activeStrategy === "SCALP") {
    return options.filter(o =>
      o.ask <= 1 &&
      (o.volume ?? 0) > 100 &&
      Math.abs(o.strike - currentPrice) <= currentPrice * 0.05
    );
  }

  if (activeStrategy === "LOTTO") {
    return options.filter(o =>
      o.ask <= 0.3 &&
      Math.abs(o.strike - currentPrice) >= currentPrice * 0.15
    );
  }

  if (activeStrategy === "SWING") {
    return options.filter(o =>
      (o.openInterest ?? 0) > 200 &&
      o.ask <= 3
    );
  }

  return options;
}

/* ===========================
   TRADE BUILDER
=========================== */
function renderTradeBuilder() {
  const out = document.getElementById("tradeBuilder");
  if (!out || !selectedOption || !currentPrice) return;

  const ask = selectedOption.ask;
  const strike = selectedOption.strike;
  const contracts = 1;
  const cost = ask * 100 * contracts;

  let breakeven;
  if (selectedOption.type === "call") {
    breakeven = strike + ask;
  } else {
    breakeven = strike - ask;
  }

  const targetMove = currentPrice * 0.05;
  const targetPrice =
    selectedOption.type === "call"
      ? currentPrice + targetMove
      : currentPrice - targetMove;

  const intrinsic =
    selectedOption.type === "call"
      ? Math.max(0, targetPrice - strike)
      : Math.max(0, strike - targetPrice);

  const estValue = intrinsic * 100;
  const pnl = estValue - cost;
  const pct = ((pnl / cost) * 100).toFixed(1);

  out.innerHTML = `
    <h3>🧮 Trade Builder</h3>
    <table>
      <tr><td>Symbol</td><td>${currentSymbol}</td></tr>
      <tr><td>Type</td><td>${selectedOption.type.toUpperCase()}</td></tr>
      <tr><td>Strike</td><td>${strike}</td></tr>
      <tr><td>Ask</td><td>$${ask}</td></tr>
      <tr><td>Cost</td><td>$${cost.toFixed(2)}</td></tr>
      <tr><td>Breakeven</td><td>$${breakeven.toFixed(2)}</td></tr>
      <tr><td>Max Loss</td><td>$${cost.toFixed(2)}</td></tr>
      <tr><td>Est % Return (±5%)</td>
          <td style="color:${pct >= 0 ? '#22c55e' : '#ef4444'}">
            ${pct}%
          </td>
      </tr>
    </table>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const optionsOutput = document.getElementById("optionsOutput");

  const callsBtn = document.getElementById("callsBtn");
  const putsBtn = document.getElementById("putsBtn");
  const expirationSelect = document.getElementById("expirationSelect");
  const maxAskInput = document.getElementById("maxAsk");

  const scalpBtn = document.getElementById("scalpBtn");
  const lottoBtn = document.getElementById("lottoBtn");
  const swingBtn = document.getElementById("swingBtn");

  function renderCandidates(data) {
    let html = `<table><thead><tr><th>Symbol</th><th>Price</th></tr></thead><tbody>`;
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
    html += "</tbody></table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(l =>
      l.onclick = loadOptionsChain
    );
  }

  async function loadOptionsChain(e) {
    e.preventDefault();
    currentSymbol = e.target.dataset.symbol;
    currentPrice = parseFloat(e.target.dataset.price);
    selectedOption = null;

    optionsOutput.innerHTML = "Loading options...";

    const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
    const data = await res.json();
    currentOptions = data.options || [];

    expirationSelect.innerHTML = `<option value="ALL">All</option>`;
    [...new Set(currentOptions.map(o => o.expiration))].forEach(exp => {
      expirationSelect.innerHTML += `<option value="${exp}">${exp}</option>`;
    });

    renderOptions();
  }

  function renderOptions() {
    let opts = currentOptions.filter(o =>
      currentType === "CALL" ? o.type === "call" : o.type === "put"
    );

    if (currentExpiration !== "ALL") {
      opts = opts.filter(o => o.expiration === currentExpiration);
    }

    const maxAsk = parseFloat(maxAskInput.value);
    if (!isNaN(maxAsk)) {
      opts = opts.filter(o => o.ask && o.ask <= maxAsk);
    }

    opts = applyStrategy(opts);

    opts = opts
      .map(o => ({ ...o, score: scoreOption(o) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    let html = `
      <table>
        <thead>
          <tr>
            <th>Type</th><th>Strike</th><th>Exp</th>
            <th>Ask</th><th>Vol</th><th>OI</th><th>Score</th>
          </tr>
        </thead>
        <tbody>
    `;

    opts.forEach(o => {
      html += `
        <tr class="option-row" style="cursor:pointer">
          <td>${o.type}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
          <td>${o.volume ?? "-"}</td>
          <td>${o.openInterest ?? "-"}</td>
          <td>${o.score.toFixed(1)}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    optionsOutput.innerHTML = html;

    document.querySelectorAll(".option-row").forEach((row, i) => {
      row.onclick = () => {
        selectedOption = opts[i];
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

  callsBtn && (callsBtn.onclick = () => { currentType = "CALL"; renderOptions(); });
  putsBtn && (putsBtn.onclick = () => { currentType = "PUT"; renderOptions(); });
  expirationSelect.onchange = () => {
    currentExpiration = expirationSelect.value;
    renderOptions();
  };
  maxAskInput.oninput = renderOptions;

  scalpBtn && (scalpBtn.onclick = () => { activeStrategy = "SCALP"; renderOptions(); });
  lottoBtn && (lottoBtn.onclick = () => { activeStrategy = "LOTTO"; renderOptions(); });
  swingBtn && (swingBtn.onclick = () => { activeStrategy = "SWING"; renderOptions(); });
});
