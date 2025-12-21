console.log("Frontend loaded");

/* ================================
   GLOBAL STATE
================================ */
let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentOptionType = "call";
let currentExpiration = "ALL";
let maxAskFilter = Infinity;

/* ================================
   DOM READY
================================ */
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

  /* ================================
     OPTION TYPE TOGGLE
  ================================ */
  callsBtn.onclick = () => {
    currentOptionType = "call";
    callsBtn.classList.add("active");
    putsBtn.classList.remove("active");
    renderOptions();
  };

  putsBtn.onclick = () => {
    currentOptionType = "put";
    putsBtn.classList.add("active");
    callsBtn.classList.remove("active");
    renderOptions();
  };

  expirationSelect.onchange = () => {
    currentExpiration = expirationSelect.value;
    renderOptions();
  };

  maxAskInput.oninput = () => {
    maxAskFilter = parseFloat(maxAskInput.value) || Infinity;
    renderOptions();
  };

  /* ================================
     RENDER CANDIDATES
  ================================ */
  function renderCandidates(data) {
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates match filter";
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

    html += `</tbody></table>`;
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(link => {
      link.addEventListener("click", loadOptionsChain);
    });
  }

  /* ================================
     LOAD OPTIONS
  ================================ */
  async function loadOptionsChain(e) {
    e.preventDefault();
    currentSymbol = e.target.dataset.symbol;
    optionsOutput.innerHTML = `Loading ${currentSymbol} options...`;

    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
      if (!res.ok) throw new Error("Options fetch failed");

      const data = await res.json();
      currentOptions = data.options || [];

      if (!currentOptions.length) {
        optionsOutput.innerHTML = "No options returned";
        return;
      }

      populateExpirations();
      renderOptions();

    } catch (err) {
      console.error(err);
      optionsOutput.innerHTML = "Error loading options";
    }
  }

  /* ================================
     EXPIRATION DROPDOWN
  ================================ */
  function populateExpirations() {
    const expirations = [...new Set(currentOptions.map(o => o.expiration))];

    expirationSelect.innerHTML =
      `<option value="ALL">All Expirations</option>` +
      expirations.map(exp =>
        `<option value="${exp}">${exp}</option>`
      ).join("");

    currentExpiration = "ALL";
  }

  /* ================================
     RENDER OPTIONS (WITH ASK FILTER)
  ================================ */
  function renderOptions() {
    if (!currentOptions.length) return;

    let filtered = currentOptions.filter(o =>
      o.type?.toLowerCase() === currentOptionType
    );

    if (currentExpiration !== "ALL") {
      filtered = filtered.filter(o => o.expiration === currentExpiration);
    }

    filtered = filtered.filter(o =>
      o.ask !== null &&
      o.ask !== undefined &&
      o.ask <= maxAskFilter
    );

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options match filters";
      return;
    }

    let html = `
      <h3>${currentSymbol} ${currentOptionType.toUpperCase()}</h3>
      <table>
        <thead>
          <tr>
            <th>Strike</th>
            <th>Expiration</th>
            <th>Last</th>
            <th>Bid</th>
            <th>Ask</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtered.forEach(o => {
      html += `
        <tr>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.last ?? "-"}</td>
          <td>${o.bid ?? "-"}</td>
          <td>${o.ask ?? "-"}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    optionsOutput.innerHTML = html;
  }

  /* ================================
     LOAD CANDIDATES
  ================================ */
  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    optionsOutput.innerHTML = "Click a symbol below";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      const data = await res.json();
      candidatesCache = data.candidates || [];
      renderCandidates(candidatesCache);
    } catch {
      candidatesOutput.innerHTML = "Error loading candidates";
    }
  };

  /* ================================
     PRICE FILTER
  ================================ */
  applyFilterBtn.onclick = () => {
    const min = parseFloat(minPriceInput.value) || 0;
    const max = parseFloat(maxPriceInput.value) || Infinity;

    renderCandidates(
      candidatesCache.filter(c => c.price >= min && c.price <= max)
    );
  };
});
