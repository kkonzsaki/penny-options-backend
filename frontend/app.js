console.log("Frontend loaded");

/* ================================
   GLOBAL STATE
================================ */
let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentFilter = "ALL";
let sortDirection = "asc"; // NEW: price sort toggle

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

  /* ================================
     RENDER CANDIDATES TABLE
  ================================ */
  function renderTable(data) {
    if (!data || data.length === 0) {
      candidatesOutput.innerHTML = "No candidates match filter";
      return;
    }

    let html = `
      <table border="1" cellpadding="6" cellspacing="0">
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

    html += `
        </tbody>
      </table>
    `;

    candidatesOutput.innerHTML = html;

    // Attach click handlers AFTER render
    document.querySelectorAll(".symbol-link").forEach(link => {
      link.addEventListener("click", loadOptionsChain);
    });
  }

  /* ================================
     SORT CANDIDATES (NEW)
  ================================ */
  function sortCandidates() {
    if (!candidatesCache.length) return;

    candidatesCache.sort((a, b) => {
      return sortDirection === "asc"
        ? a.price - b.price
        : b.price - a.price;
    });

    sortDirection = sortDirection === "asc" ? "desc" : "asc";
    renderTable(candidatesCache);
  }

  /* ================================
     LOAD OPTIONS CHAIN
  ================================ */
  async function loadOptionsChain(e) {
    e.preventDefault();
    const symbol = e.target.dataset.symbol;
    currentSymbol = symbol;

    optionsOutput.innerHTML = `Loading options for ${symbol}...`;

    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
      if (!res.ok) throw new Error("Options fetch failed");

      const data = await res.json();
      const options = data.options || data.calls || [];

      if (!options.length) {
        optionsOutput.innerHTML = "No options returned";
        return;
      }

      let html = `
        <h4>${symbol} Options</h4>
        <table border="1" cellpadding="6" cellspacing="0">
          <thead>
            <tr>
              <th>Type</th>
              <th>Strike</th>
              <th>Expiration</th>
              <th>Last</th>
              <th>Bid</th>
              <th>Ask</th>
            </tr>
          </thead>
          <tbody>
      `;

      options.forEach(opt => {
        html += `
          <tr>
            <td>${opt.type || "?"}</td>
            <td>${opt.strike}</td>
            <td>${opt.expiration}</td>
            <td>${opt.last ?? "-"}</td>
            <td>${opt.bid ?? "-"}</td>
            <td>${opt.ask ?? "-"}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      optionsOutput.innerHTML = html;

    } catch (err) {
      console.error(err);
      optionsOutput.innerHTML = "Error loading options chain";
    }
  }

  /* ================================
     LOAD CANDIDATES BUTTON
  ================================ */
  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    optionsOutput.textContent = "Click a symbol above";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();
      candidatesCache = data.candidates || [];

      // NEW: auto-sort on load
      sortCandidates();

    } catch (err) {
      console.error(err);
      candidatesOutput.innerHTML = "Error loading candidates";
    }
  };

  /* ================================
     PRICE FILTER
  ================================ */
  applyFilterBtn.onclick = () => {
    if (!candidatesCache.length) return;

    const min = parseFloat(minPriceInput.value) || 0;
    const max = parseFloat(maxPriceInput.value) || Infinity;

    const filtered = candidatesCache.filter(c =>
      c.price >= min && c.price <= max
    );

    renderTable(filtered);
  };
});
