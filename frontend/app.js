console.log("Frontend loaded");

let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentType = "CALL";
let currentExpiration = "ALL";
let currentPrice = null;

const WATCHLIST_KEY = "penny_watchlist";

/* ===========================
   WATCHLIST HELPERS
=========================== */
function getWatchlist() {
  return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
}

function saveWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}

function toggleWatchlist(symbol, price) {
  let list = getWatchlist();
  const exists = list.find(s => s.symbol === symbol);

  if (exists) {
    list = list.filter(s => s.symbol !== symbol);
  } else {
    list.push({ symbol, price });
  }

  saveWatchlist(list);
  renderWatchlist();
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

  /* ===========================
     WATCHLIST RENDER
  =========================== */
  function renderWatchlist() {
    const list = getWatchlist();

    if (!list.length) return;

    let html = `
      <h3>⭐ Watchlist</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
    `;

    list.forEach(item => {
      html += `
        <tr>
          <td>
            <a href="#" class="watch-symbol" data-symbol="${item.symbol}" data-price="${item.price}">
              ${item.symbol}
            </a>
          </td>
          <td>${item.price}</td>
          <td>
            <button data-remove="${item.symbol}">✕</button>
          </td>
        </tr>
      `;
    });

    html += "</tbody></table><hr />";

    candidatesOutput.innerHTML = html + candidatesOutput.innerHTML;

    document.querySelectorAll(".watch-symbol").forEach(link => {
      link.addEventListener("click", loadOptionsChain);
    });

    document.querySelectorAll("button[data-remove]").forEach(btn => {
      btn.onclick = () => {
        let list = getWatchlist().filter(s => s.symbol !== btn.dataset.remove);
        saveWatchlist(list);
        renderWatchlist();
      };
    });
  }

  /* ===========================
     CANDIDATES TABLE
  =========================== */
  function renderCandidates(data) {
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates returned";
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>⭐</th>
            <th>Symbol</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
    `;

    const watchlist = getWatchlist();

    data.forEach(c => {
      const starred = watchlist.some(w => w.symbol === c.symbol) ? "★" : "☆";

      html += `
        <tr>
          <td>
            <button class="star-btn" data-symbol="${c.symbol}" data-price="${c.price}">
              ${starred}
            </button>
          </td>
          <td>
            <a href="#" class="symbol-link" data-symbol="${c.symbol}" data-price="${c.price}">
              ${c.symbol}
            </a>
          </td>
          <td>${c.price}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    candidatesOutput.innerHTML = html;

    renderWatchlist();

    document.querySelectorAll(".symbol-link").forEach(link => {
      link.addEventListener("click", loadOptionsChain);
    });

    document.querySelectorAll(".star-btn").forEach(btn => {
      btn.onclick = () => toggleWatchlist(btn.dataset.symbol, btn.dataset.price);
    });
  }

  /* ===========================
     LOAD OPTIONS
  =========================== */
  async function loadOptionsChain(e) {
    e.preventDefault();
    currentSymbol = e.target.dataset.symbol;
    currentPrice = parseFloat(e.target.dataset.price);

    optionsOutput.innerHTML = `Loading ${currentSymbol} options...`;

    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
      if (!res.ok) throw new Error("Options fetch failed");

      const data = await res.json();
      currentOptions = data.options || [];

      buildExpirationDropdown(currentOptions);
      renderOptions();

    } catch (err) {
      console.error(err);
      optionsOutput.innerHTML = "Error loading options";
    }
  }

  /* ===========================
     EXPIRATION DROPDOWN
  =========================== */
  function buildExpirationDropdown(options) {
    const expirations = [...new Set(options.map(o => o.expiration))];
    expirationSelect.innerHTML = `<option value="ALL">All Expirations</option>`;

    expirations.forEach(exp => {
      const opt = document.createElement("option");
      opt.value = exp;
      opt.textContent = exp;
      expirationSelect.appendChild(opt);
    });
  }

  /* ===========================
     ITM / OTM
  =========================== */
  function itmOtmInfo(option) {
    if (!currentPrice) return { label: "?", pct: "-" };

    let distance, label;

    if (option.type === "call") {
      distance = ((currentPrice - option.strike) / currentPrice) * 100;
      label = currentPrice > option.strike ? "ITM" : "OTM";
    } else {
      distance = ((option.strike - currentPrice) / currentPrice) * 100;
      label = currentPrice < option.strike ? "ITM" : "OTM";
    }

    return { label, pct: distance.toFixed(2) + "%" };
  }

  function scoreOption(o) {
    const askScore = o.ask ? 1 / o.ask : 0;
    return askScore + (o.volume || 0) * 0.01 + (o.openInterest || 0) * 0.005;
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

    filtered.sort((a, b) => scoreOption(b) - scoreOption(a));

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options match filters";
      return;
    }

    let html = `
      <h3>${currentSymbol} ${currentType}s (Price: ${currentPrice})</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Strike</th>
            <th>Exp</th>
            <th>ITM/OTM</th>
            <th>%</th>
            <th>Bid</th>
            <th>Ask</th>
            <th>Vol</th>
            <th>OI</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtered.forEach(o => {
      const io = itmOtmInfo(o);
      html += `
        <tr>
          <td>${o.type}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${io.label}</td>
          <td>${io.pct}</td>
          <td>${o.bid ?? "-"}</td>
          <td><strong>${o.ask ?? "-"}</strong></td>
          <td>${o.volume ?? "-"}</td>
          <td>${o.openInterest ?? "-"}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    optionsOutput.innerHTML = html;
  }

  callsBtn.onclick = () => { currentType = "CALL"; renderOptions(); };
  putsBtn.onclick = () => { currentType = "PUT"; renderOptions(); };
  expirationSelect.onchange = () => { currentExpiration = expirationSelect.value; renderOptions(); };
  maxAskInput.oninput = renderOptions;

  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    optionsOutput.innerHTML = "Click a symbol above";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      const data = await res.json();
      candidatesCache = data.candidates || [];
      renderCandidates(candidatesCache);
    } catch (err) {
      console.error(err);
      candidatesOutput.innerHTML = "Error loading candidates";
    }
  };

  applyFilterBtn.onclick = () => {
    const min = parseFloat(minPriceInput.value) || 0;
    const max = parseFloat(maxPriceInput.value) || Infinity;
    renderCandidates(candidatesCache.filter(c => c.price >= min && c.price <= max));
  };
});
