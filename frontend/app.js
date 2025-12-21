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
     SORT + FILTER + RENDER
  =========================== */
  function renderOptions() {
    if (!currentOptions.length) {
      optionsOutput.innerHTML = "No options available";
      return;
    }

    let filtered = currentOptions.filter(o =>
      (currentType === "CALL" ? o.type === "call" : o.type === "put")
    );

    if (currentExpiration !== "ALL") {
      filtered = filtered.filter(o => o.expiration === currentExpiration);
    }

    const maxAsk = parseFloat(maxAskInput.value);
    if (!isNaN(maxAsk)) {
      filtered = filtered.filter(o => o.ask !== null && o.ask <= maxAsk);
    }

    /* 🔥 SORT BY CHEAPEST ASK */
    filtered.sort((a, b) => {
      if (a.ask == null) return 1;
      if (b.ask == null) return -1;
      return a.ask - b.ask;
    });

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options match filters";
      return;
    }

    let html = `
      <h3>${currentSymbol} ${currentType}s</h3>
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

    filtered.forEach(o => {
      html += `
        <tr>
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
  }

  /* ===========================
     CONTROLS
  =========================== */
  callsBtn.onclick = () => {
    currentType = "CALL";
    callsBtn.classList.add("active");
    putsBtn.classList.remove("active");
    renderOptions();
  };

  putsBtn.onclick = () => {
    currentType = "PUT";
    putsBtn.classList.add("active");
    callsBtn.classList.remove("active");
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
