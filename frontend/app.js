console.log("Frontend loaded");

let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentType = "CALL";
let currentExpiration = "ALL";
let currentPrice = null;
let activeStrategy = "ALL";

const WATCHLIST_KEY = "penny_watchlist";

/* ===========================
   STORAGE
=========================== */
function getWatchlist() {
  return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
}

function saveWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}

/* ===========================
   SCORING ENGINE
=========================== */
function scoreOption(o) {
  const bid = o.bid ?? 0;
  const ask = o.ask ?? 999;
  const spread = ask - bid;
  const volume = o.volume ?? 0;
  const oi = o.openInterest ?? 0;

  if (ask <= 0 || spread < 0) return -999;

  return (
    volume * 0.3 +
    oi * 0.3 -
    spread * 2 -
    ask * 1.5
  );
}

/* ===========================
   STRATEGY FILTERS (STEP 13)
=========================== */
function applyStrategy(options) {
  if (activeStrategy === "SCALP") {
    return options.filter(o =>
      o.ask <= 1.0 &&
      (o.volume ?? 0) > 100 &&
      Math.abs(o.strike - currentPrice) <= currentPrice * 0.05
    );
  }

  if (activeStrategy === "LOTTO") {
    return options.filter(o =>
      o.ask <= 0.30 &&
      Math.abs(o.strike - currentPrice) >= currentPrice * 0.15
    );
  }

  if (activeStrategy === "SWING") {
    return options.filter(o =>
      (o.openInterest ?? 0) > 200 &&
      o.ask <= 3.0
    );
  }

  return options;
}

document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const optionsOutput = document.getElementById("optionsOutput");

  const minPriceInput = document.getElementById("minPrice");
  const maxPriceInput = document.getElementById("maxPrice");
  const applyFilterBtn = document.getElementById("applyFilter");

  const callsBtn = document.getElementById("callsBtn");
  const putsBtn = document.getElementById("putsBtn");
  const expirationSelect = document.getElementById("expirationSelect");
  const maxAskInput = document.getElementById("maxAsk");

  // Strategy buttons (safe if missing)
  const scalpBtn = document.getElementById("scalpBtn");
  const lottoBtn = document.getElementById("lottoBtn");
  const swingBtn = document.getElementById("swingBtn");

  /* ===========================
     CANDIDATES
  =========================== */
  function renderCandidates(data) {
    let html = `
      <table>
        <thead><tr><th>Symbol</th><th>Price</th></tr></thead>
        <tbody>
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

    html += "</tbody></table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(l =>
      l.addEventListener("click", loadOptionsChain)
    );
  }

  /* ===========================
     OPTIONS
  =========================== */
  async function loadOptionsChain(e) {
    e.preventDefault();
    currentSymbol = e.target.dataset.symbol;
    currentPrice = parseFloat(e.target.dataset.price);

    optionsOutput.innerHTML = "Loading options...";

    const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
    const data = await res.json();
    currentOptions = data.options || [];

    buildExpirationDropdown();
    renderOptions();
  }

  function buildExpirationDropdown() {
    expirationSelect.innerHTML = `<option value="ALL">All</option>`;
    [...new Set(currentOptions.map(o => o.expiration))].forEach(exp => {
      expirationSelect.innerHTML += `<option value="${exp}">${exp}</option>`;
    });
  }

  function renderOptions() {
    let filtered = currentOptions.filter(o =>
      currentType === "CALL" ? o.type === "call" : o.type === "put"
    );

    if (currentExpiration !== "ALL") {
      filtered = filtered.filter(o => o.expiration === currentExpiration);
    }

    const maxAsk = parseFloat(maxAskInput.value);
    if (!isNaN(maxAsk)) {
      filtered = filtered.filter(o => o.ask !== null && o.ask <= maxAsk);
    }

    filtered = applyStrategy(filtered);

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options match filters";
      return;
    }

    const ranked = [...filtered]
      .map(o => ({ ...o, score: scoreOption(o) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    let html = `
      <h3>🏆 Best Plays — ${activeStrategy}</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th><th>Strike</th><th>Exp</th>
            <th>Ask</th><th>Vol</th><th>OI</th><th>Score</th>
          </tr>
        </thead>
        <tbody>
    `;

    ranked.forEach(o => {
      html += `
        <tr style="background:#14532d;">
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
  }

  /* ===========================
     BUTTONS
  =========================== */
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

  candidatesBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  applyFilterBtn.onclick = () => {
    const min = parseFloat(minPriceInput.value) || 0;
    const max = parseFloat(maxPriceInput.value) || Infinity;
    renderCandidates(candidatesCache.filter(c => c.price >= min && c.price <= max));
  };
});
