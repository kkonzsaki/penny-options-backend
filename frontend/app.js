console.log("Frontend loaded");

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let optionsCache = [];
let currentFilter = "all";

let scannerRunning = false;
let scannerTimer = null;

/* ===========================
   THEME
=========================== */
document.addEventListener("DOMContentLoaded", () => {

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

  /* ===========================
     ELEMENTS
  =========================== */
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const optionsOutput = document.getElementById("optionsOutput");

  const showAll = document.getElementById("showAll");
  const showCalls = document.getElementById("showCalls");
  const showPuts = document.getElementById("showPuts");

  const scannerToggle = document.getElementById("scannerToggle");
  const scannerStatus = document.getElementById("scannerStatus");
  const scannerLog = document.getElementById("scannerLog");

  /* ===========================
     CANDIDATES
  =========================== */
candidatesBtn.onclick = async () => {
  candidatesOutput.innerHTML = "Loading candidates...";

  try {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    const newData = data.candidates || [];

    if (!newData.length) {
      candidatesOutput.innerHTML = "No candidates returned";
      return;
    }

    runScanner(newData);

    previousPrices = Object.fromEntries(
      newData.map(c => [c.symbol, c.price])
    );

    candidatesCache = newData;
    renderCandidates(candidatesCache);

  } catch (err) {
    console.error("Failed to load candidates:", err);
    candidatesOutput.innerHTML =
      "❌ Failed to load candidates. Check Render backend.";
  }
};


  function renderCandidates(list) {
    let html = `<table>
      <tr><th>Symbol</th><th>Price</th></tr>`;

    list.forEach(c => {
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

  candidatesBtn.onclick = loadCandidates;

  /* ===========================
     OPTIONS
  =========================== */
  async function loadOptions(symbol) {
    optionsOutput.innerHTML = `Loading options for ${symbol}...`;

    try {
      const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
      if (!res.ok) throw new Error("Options request failed");

      const data = await res.json();
      optionsCache = data.options || [];

      renderOptions();
    } catch (err) {
      console.error(err);
      optionsOutput.innerHTML =
        `<span style="color:red">Option chain not found</span>`;
    }
  }

function renderOptions() {
  let filtered = optionsCache.filter(o => o && o.type);

  if (currentFilter !== "all") {
    filtered = filtered.filter(o => o.type === currentFilter);
  }

  if (!filtered.length) {
    optionsOutput.innerHTML = "No options available";
    return;
  }

  let html = `<table>
    <tr>
      <th>Type</th>
      <th>Strike</th>
      <th>Expiration</th>
      <th>Ask</th>
    </tr>`;

  filtered.slice(0, 25).forEach(o => {
    html += `
      <tr class="${o.type}">
        <td>${o.type.toUpperCase()}</td>
        <td>${o.strike ?? "-"}</td>
        <td>${o.expiration ?? "-"}</td>
        <td>${o.ask ?? "-"}</td>
      </tr>`;
  });

  html += "</table>";
  optionsOutput.innerHTML = html;
}


  showAll.onclick = () => { currentFilter = "all"; renderOptions(); };
  showCalls.onclick = () => { currentFilter = "call"; renderOptions(); };
  showPuts.onclick = () => { currentFilter = "put"; renderOptions(); };

  /* ===========================
     SCANNER
  =========================== */
  scannerToggle.onclick = () => {
  scannerRunning = !scannerRunning;

  if (scannerRunning) {
    scannerStatus.textContent = "Running (60s)";
    scannerToggle.textContent = "⏸ Stop Scanner";

    scannerInterval = setInterval(async () => {
      try {
        candidatesBtn.click();
      } catch (err) {
        console.error("Scanner fetch failed", err);
        logScanner("⚠ Scanner fetch failed");
      }
    }, 60000);

    logScanner("Scanner started");
  } else {
    clearInterval(scannerInterval);
    scannerInterval = null;
    scannerStatus.textContent = "Stopped";
    scannerToggle.textContent = "▶ Start Scanner";
    logScanner("Scanner stopped");
  }
};


  async function runScanner() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      if (!res.ok) throw new Error("Scanner fetch failed");

      const data = await res.json();
      logScanner(`Scan found ${data.candidates?.length || 0} symbols`);
    } catch (err) {
      console.error(err);
      logScanner("Scanner error");
    }
  }

  function logScanner(msg) {
    const time = new Date().toLocaleTimeString();
    scannerLog.innerHTML =
      `<div>[${time}] ${msg}</div>` + scannerLog.innerHTML;
  }

});
