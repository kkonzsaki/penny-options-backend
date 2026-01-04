console.log("Frontend booted");

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let previousPrices = {};
let optionsCache = [];
let currentFilter = "all";

/* ===========================
   API BASE - Using the one from config.js
=========================== */
console.log("Using API_BASE:", API_BASE);

/* ===========================
   THEME TOGGLE
=========================== */
window.addEventListener('load', () => {
  console.log("Window loaded, setting up theme");
  
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme") || "dark";

  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️ Light";
  } else {
    themeToggle.textContent = "🌙 Dark";
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.textContent = isLight ? "☀️ Light" : "🌙 Dark";
  });
});

/* ===========================
   MAIN
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded");
  
  // Get all elements using the ACTUAL IDs from your HTML
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

  // Debug - check if elements exist
  console.log("candidatesBtn:", candidatesBtn);
  console.log("scannerToggle:", scannerToggle);
  console.log("showAll:", showAll);

  let scannerInterval = null;

  /* ===========================
     RENDER CANDIDATES
  =========================== */
  function renderCandidates(data) {
    console.log("Rendering candidates:", data);
    
    if (!data || !data.length) {
      candidatesOutput.innerHTML = "<p>No candidates found</p>";
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
          <td>$${c.price.toFixed(2)}</td>
        </tr>`;
    });

    html += "</table>";
    candidatesOutput.innerHTML = html;

    // Add click handlers to symbol links
    document.querySelectorAll(".symbol-link").forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const symbol = link.dataset.symbol;
        console.log("Loading options for:", symbol);
        loadOptions(symbol);
      });
    });
  }

  /* ===========================
     LOAD OPTIONS
  =========================== */
  async function loadOptions(symbol) {
    optionsOutput.innerHTML = `<p>Loading options for ${symbol}...</p>`;

    try {
      const url = `${API_BASE}/api/v1/options/${symbol}`;
      console.log("Fetching options from:", url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Options data received:", data);
      
      optionsCache = data.options || [];
      currentFilter = "all";
      renderOptions();
    } catch (err) {
      optionsOutput.innerHTML = `<p style="color: var(--put)">Failed to load options: ${err.message}</p>`;
      console.error("Options fetch error:", err);
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

    console.log("Rendering options, filter:", currentFilter, "count:", filtered.length);

    if (!filtered.length) {
      optionsOutput.innerHTML = "<p>No options found</p>";
      return;
    }

    let html = `<table>
      <tr>
        <th>Type</th>
        <th>Strike</th>
        <th>Expiration</th>
        <th>Ask</th>
      </tr>`;

    filtered.slice(0, 50).forEach(o => {
      const optType = o.option_type || o.type || 'unknown';
      html += `
        <tr class="${optType}">
          <td class="${optType}">
            ${optType.toUpperCase()}
          </td>
          <td>${o.strike || 'N/A'}</td>
          <td>${o.expiration || 'N/A'}</td>
          <td>${o.ask || 'N/A'}</td>
        </tr>`;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;
  }

  /* ===========================
     FILTER BUTTONS
  =========================== */
  if (showAll) {
    showAll.addEventListener('click', () => {
      console.log("Show All clicked");
      currentFilter = "all";
      renderOptions();
    });
  }

  if (showCalls) {
    showCalls.addEventListener('click', () => {
      console.log("Show Calls clicked");
      currentFilter = "call";
      renderOptions();
    });
  }

  if (showPuts) {
    showPuts.addEventListener('click', () => {
      console.log("Show Puts clicked");
      currentFilter = "put";
      renderOptions();
    });
  }

  /* ===========================
     LOAD CANDIDATES
  =========================== */
  if (candidatesBtn) {
    candidatesBtn.addEventListener('click', async () => {
      console.log("Load Candidates clicked");
      candidatesOutput.innerHTML = "<p>Loading candidates...</p>";

      try {
        const url = `${API_BASE}/api/v1/candidates`;
        console.log("Fetching candidates from:", url);
        
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Candidates data received:", data);
        
        const newData = data.candidates || [];

        previousPrices = Object.fromEntries(
          newData.map(c => [c.symbol, c.price])
        );

        candidatesCache = newData;
        renderCandidates(candidatesCache);
      } catch (err) {
        candidatesOutput.innerHTML = `<p style="color: var(--put)">Failed to load candidates: ${err.message}</p>`;
        console.error("Candidates fetch error:", err);
      }
    });
  } else {
    console.error("candidatesBtn not found!");
  }

  /* ===========================
     APPLY PRICE FILTER
  =========================== */
  if (applyFilter) {
    applyFilter.addEventListener('click', () => {
      console.log("Apply Filter clicked");
      const min = Number(minPrice.value) || 0;
      const max = Number(maxPrice.value) || Infinity;

      console.log("Filter range:", min, "to", max);

      const filtered = candidatesCache.filter(c => c.price >= min && c.price <= max);
      renderCandidates(filtered);
    });
  }

  /* ===========================
     SCANNER
  =========================== */
  if (scannerToggle) {
    scannerToggle.addEventListener('click', () => {
      console.log("Scanner toggle clicked");
      
      if (scannerInterval) {
        clearInterval(scannerInterval);
        scannerInterval = null;
        scannerStatus.textContent = "Stopped";
        scannerToggle.textContent = "▶ Start";
        console.log("Scanner stopped");
        return;
      }

      scannerStatus.textContent = "Running (60s)";
      scannerToggle.textContent = "⏸ Stop";
      console.log("Scanner started");

      // Run immediately
      if (candidatesBtn) {
        candidatesBtn.click();
      }

      // Then run every 60 seconds
      scannerInterval = setInterval(() => {
        console.log("Scanner auto-refresh");
        if (candidatesBtn) {
          candidatesBtn.click();
        }
      }, 60000);
    });
  } else {
    console.error("scannerToggle not found!");
  }

  console.log("All event listeners attached");
});
