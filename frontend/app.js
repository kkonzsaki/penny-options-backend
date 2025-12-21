console.log("Frontend loaded");

let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentType = "CALL";
let currentExpiration = "ALL";

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

  const exportAllBtn = document.getElementById("exportAll");
  const exportBestBtn = document.getElementById("exportBest");

  let lastRenderedOptions = [];

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
            <th>Symbol</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
    `;

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

    html += "</tbody></table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(link => {
      link.addEventListener("click", loadOptionsChain);
    });
  }

  /* ===========================
     LOAD OPTIONS CHAIN
  =========================== */
  async function loadOptionsChain(e) {
    e.preventDefault();
    currentSymbol = e.target.dataset.symbol;
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
     SCORE OPTIONS
  =========================== */
  function scoreOption(o) {
    const askScore = o.ask ? 1 / o.ask : 0;
    const volumeScore = o.volume || 0;
    const oiScore = o.openInterest || o.oi || 0;

    return askScore * 5 + volumeScore * 0.01 + oiScore * 0.005;
  }

  /* ===========================
     CSV HELPERS (STEP 7)
  =========================== */
  function downloadCSV(filename, rows) {
    const header = Object.keys(rows[0]).join(",");
    const body = rows.map(r =>
      Object.values(r).map(v => `"${v ?? ""}"`).join(",")
    );

    const csv = [header, ...body].join("\n");
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
     RENDER OPTIONS TABLE
  =========================== */
  function renderOptions() {
    if (!currentOptions.length) {
      optionsOutput.innerHTML = "No options available";
      return;
    }

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
      lastRenderedOptions = [];
      return;
    }

    filtered.sort((a, b) => scoreOption(b) - scoreOption(a));
    lastRenderedOptions = filtered;

    let html = `
      <h3>${currentSymbol} ${currentType}s</h3>

      <div style="margin-bottom:10px;">
        <button id="exportBest">Export Best</button>
        <button id="exportAll">Export All</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Strike</th>
            <th>Expiration</th>
            <th>Bid</th>
            <th>Ask</th>
            <th>Last</th>
            <th>Volume</th>
            <th>Open Int</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtered.forEach((o, index) => {
      const highlight = index === 0 ? `style="background:#064e3b;font-weight:bold;"` : "";

      html += `
        <tr ${highlight}>
          <td>${o.type}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.bid ?? "-"}</td>
          <td><strong>${o.ask ?? "-"}</strong></td>
          <td>${o.last ?? "-"}</td>
          <td>${o.volume ?? "-"}</td>
          <td>${o.openInterest ?? o.oi ?? "-"}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    optionsOutput.innerHTML = html;

    document.getElementById("exportAll").onclick = exportAllCSV;
    document.getElementById("exportBest").onclick = exportBestCSV;
  }

  /* ===========================
     CSV EXPORT ACTIONS
  =========================== */
  function exportAllCSV() {
    if (!lastRenderedOptions.length) return;

    const rows = lastRenderedOptions.map(o => ({
      symbol: currentSymbol,
      type: o.type,
      strike: o.strike,
      expiration: o.expiration,
      bid: o.bid,
      ask: o.ask,
      last: o.last,
      volume: o.volume,
      openInterest: o.openInterest ?? o.oi
    }));

    downloadCSV(`${currentSymbol}_options.csv`, rows);
  }

  function exportBestCSV() {
    if (!lastRenderedOptions.length) return;

    const o = lastRenderedOptions[0];

    downloadCSV(`${currentSymbol}_best_option.csv`, [{
      symbol: currentSymbol,
      type: o.type,
      strike: o.strike,
      expiration: o.expiration,
      bid: o.bid,
      ask: o.ask,
      last: o.last,
      volume: o.volume,
      openInterest: o.openInterest ?? o.oi
    }]);
  }

  /* ===========================
     CONTROLS
  =========================== */
  callsBtn.onclick = () => {
    currentType = "CALL";
    renderOptions();
  };

  putsBtn.onclick = () => {
    currentType = "PUT";
    renderOptions();
  };

  expirationSelect.onchange = () => {
    currentExpiration = expirationSelect.value;
    renderOptions();
  };

  maxAskInput.oninput = renderOptions;

  /* ===========================
     LOAD CANDIDATES
  =========================== */
  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    optionsOutput.innerHTML = "Click a symbol above";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      if (!res.ok) throw new Error("Candidates fetch failed");

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

    const filtered = candidatesCache.filter(c =>
      c.price >= min && c.price <= max
    );

    renderCandidates(filtered);
  };
});
