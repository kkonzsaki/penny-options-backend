console.log("Frontend booted");

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let previousPrices = {};
let optionsCache = [];
let currentFilter = "all";

/* ===========================
   THEME TOGGLE
=========================== */
window.onload = () => {
   console.log("candidatesBtn:", candidatesBtn);
console.log("scannerToggle:", scannerToggle);
console.log("themeToggle:", document.getElementById("themeToggle"));

  console.log("DOM fully loaded");

  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme") || "dark";

  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️ Light";
  }

  themeToggle.onclick = () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.textContent = isLight ? "☀️ Light" : "🌙 Dark";
  };
});

/* ===========================
   MAIN
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const optionsOutput = document.getElementById("optionsOutput");

  const minPrice = document.getElementById("minPrice");
  const maxPrice = document.getElementById("maxPrice");
  const applyFilter = document.getElementById("applyFilter");

  const showAll = document.getElementById("showAll");
  const showCalls = document.getElementById("showCalls");
  const showPuts = document.getElementById("showPuts");

  const scannerToggle = document.getElementById("scannerToggle");
  const scannerStatus = document.getElementById("scannerStatus");

  let scannerInterval = null;

  /* ===========================
     RENDER CANDIDATES
  =========================== */
  function renderCandidates(data) {
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates found";
      return;
    }

    let html = `<table>
      <tr><th>Symbol</th><th>Price</th></tr>`;

    data.forEach(c => {
      html += `
        <tr>
          <td>
            <a href="#" class="symbol-link" data-symbol="${c.symbol}">
              ${c.symbol}
            </a>
          </td>
          <td>${c.price}</td>
        </tr>`;
    });

    html += "</table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        loadOptions(link.dataset.symbol);
      };
    });
  }

  /* ===========================
     LOAD OPTIONS
  =========================== */
  async function loadOptions(symbol) {
    optionsOutput.innerHTML = `Loading options for ${symbol}...`;

    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
      if (!res.ok) throw new Error("Options fetch failed");

      const data = await res.json();
      optionsCache = data.options || [];
      currentFilter = "all";
      renderOptions();
    } catch (err) {
      optionsOutput.innerHTML = "Failed to load options";
      console.error(err);
    }
  }

  /* ===========================
     RENDER OPTIONS
  =========================== */
  function renderOptions() {
    let filtered = optionsCache;

    if (currentFilter !== "all") {
      filtered = optionsCache.filter(o => o.option_type === currentFilter);
    }

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options found";
      return;
    }

    let html = `<table>
      <tr>
        <th>Type</th>
        <th>Strike</th>
        <th>Expiration</th>
        <th>Ask</th>
      </tr>`;

    filtered.slice(0, 20).forEach(o => {
      html += `
        <tr class="${o.option_type}">
          <td class="${o.option_type}">
            ${o.option_type.toUpperCase()}
          </td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
        </tr>`;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;
  }

  showAll.onclick = () => { currentFilter = "all"; renderOptions(); };
  showCalls.onclick = () => { currentFilter = "call"; renderOptions(); };
  showPuts.onclick = () => { currentFilter = "put"; renderOptions(); };

  /* ===========================
     LOAD CANDIDATES
  =========================== */
  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading candidates...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      if (!res.ok) throw new Error("Candidates fetch failed");

      const data = await res.json();
      const newData = data.candidates || [];

      previousPrices = Object.fromEntries(
        newData.map(c => [c.symbol, c.price])
      );

      candidatesCache = newData;
      renderCandidates(candidatesCache);
    } catch (err) {
      candidatesOutput.innerHTML = "Failed to load candidates";
      console.error(err);
    }
  };

  applyFilter.onclick = () => {
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Infinity;

    renderCandidates(
      candidatesCache.filter(c => c.price >= min && c.price <= max)
    );
  };

  /* ===========================
     SCANNER (SAFE)
  =========================== */
  scannerToggle.onclick = () => {
    if (scannerInterval) {
      clearInterval(scannerInterval);
      scannerInterval = null;
      scannerStatus.textContent = "Stopped";
      scannerToggle.textContent = "▶ Start Scanner";
      return;
    }

    scannerStatus.textContent = "Running (60s)";
    scannerToggle.textContent = "⏸ Stop Scanner";

    scannerInterval = setInterval(() => {
      candidatesBtn.click();
    }, 60000);
  };
};
