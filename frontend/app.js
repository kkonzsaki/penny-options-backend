console.log("Frontend loaded");

let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentType = "CALL";
let currentExpiration = "ALL";
let currentPrice = null;

const WATCHLIST_KEY = "penny_watchlist";

/* ===========================
   CSV HELPERS
=========================== */
function downloadCSV(filename, rows) {
  if (!rows.length) return alert("Nothing to export");

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r =>
      headers.map(h => `"${r[h] ?? ""}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ===========================
   WATCHLIST STORAGE
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

  const exportWatchlistBtn = document.getElementById("exportWatchlist");
  const exportOptionsBtn = document.getElementById("exportOptions");

  /* ===========================
     WATCHLIST RENDER
  =========================== */
  function renderWatchlist() {
    const list = getWatchlist();
    if (!list.length) return;

    let html = `
      <h3>⭐ Watchlist</h3>
      <button id="exportWatchlist">Export Watchlist CSV</button>
      <table>
        <thead><tr><th>Symbol</th><th>Price</th><th></th></tr></thead>
        <tbody>
    `;

    list.forEach(item => {
      html += `
        <tr>
          <td><a href="#" class="watch-symbol" data-symbol="${item.symbol}" data-price="${item.price}">${item.symbol}</a></td>
          <td>${item.price}</td>
          <td><button data-remove="${item.symbol}">✕</button></td>
        </tr>
      `;
    });

    html += "</tbody></table><hr />";
    candidatesOutput.innerHTML = html + candidatesOutput.innerHTML;

    document.getElementById("exportWatchlist").onclick = () =>
      downloadCSV("watchlist.csv", getWatchlist());

    document.querySelectorAll(".watch-symbol").forEach(l =>
      l.addEventListener("click", loadOptionsChain)
    );

    document.querySelectorAll("button[data-remove]").forEach(btn => {
      btn.onclick = () => {
        saveWatchlist(getWatchlist().filter(s => s.symbol !== btn.dataset.remove));
        renderWatchlist();
      };
    });
  }

  /* ===========================
     CANDIDATES
  =========================== */
  function renderCandidates(data) {
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates returned";
      return;
    }

    const watchlist = getWatchlist();

    let html = `
      <table>
        <thead><tr><th>⭐</th><th>Symbol</th><th>Price</th></tr></thead>
        <tbody>
    `;

    data.forEach(c => {
      const starred = watchlist.some(w => w.symbol === c.symbol) ? "★" : "☆";
      html += `
        <tr>
          <td><button class="star-btn" data-symbol="${c.symbol}" data-price="${c.price}">${starred}</button></td>
          <td><a href="#" class="symbol-link" data-symbol="${c.symbol}" data-price="${c.price}">${c.symbol}</a></td>
          <td>${c.price}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    candidatesOutput.innerHTML = html;

    renderWatchlist();

    document.querySelectorAll(".symbol-link").forEach(l =>
      l.addEventListener("click", loadOptionsChain)
    );

    document.querySelectorAll(".star-btn").forEach(b =>
      b.onclick = () => toggleWatchlist(b.dataset.symbol, b.dataset.price)
    );
  }

  /* ===========================
     OPTIONS
  =========================== */
  async function loadOptionsChain(e) {
    e.preventDefault();
    currentSymbol = e.target.dataset.symbol;
    currentPrice = parseFloat(e.target.dataset.price);
    optionsOutput.innerHTML = `Loading ${currentSymbol} options...`;

    const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
    const data = await res.json();
    currentOptions = data.options || [];

    buildExpirationDropdown(currentOptions);
    renderOptions();
  }

  function buildExpirationDropdown(options) {
    expirationSelect.innerHTML = `<option value="ALL">All Expirations</option>`;
    [...new Set(options.map(o => o.expiration))].forEach(exp => {
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

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options match filters";
      return;
    }

    let html = `
      <h3>${currentSymbol} Options</h3>
      <button id="exportOptions">Export Options CSV</button>
      <table>
        <thead>
          <tr>
            <th>Type</th><th>Strike</th><th>Exp</th>
            <th>Bid</th><th>Ask</th><th>Vol</th><th>OI</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtered.forEach(o => {
      html += `
        <tr>
          <td>${o.type}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.bid ?? "-"}</td>
          <td>${o.ask ?? "-"}</td>
          <td>${o.volume ?? "-"}</td>
          <td>${o.openInterest ?? "-"}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    optionsOutput.innerHTML = html;

    document.getElementById("exportOptions").onclick = () =>
      downloadCSV(
        `${currentSymbol}_options.csv`,
        filtered.map(o => ({
          symbol: currentSymbol,
          type: o.type,
          strike: o.strike,
          expiration: o.expiration,
          bid: o.bid,
          ask: o.ask,
          volume: o.volume,
          openInterest: o.openInterest
        }))
      );
  }

  callsBtn.onclick = () => { currentType = "CALL"; renderOptions(); };
  putsBtn.onclick = () => { currentType = "PUT"; renderOptions(); };
  expirationSelect.onchange = () => { currentExpiration = expirationSelect.value; renderOptions(); };
  maxAskInput.oninput = renderOptions;

  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
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
