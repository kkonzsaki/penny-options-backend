console.log("Frontend booted");

/* ===================== DOM ===================== */
const loadBtn = document.getElementById("candidatesBtn");
const candidatesOut = document.getElementById("candidatesOutput");
const optionsOut = document.getElementById("optionsOutput");
const scannerBtn = document.getElementById("scannerToggle");
const scannerStatus = document.getElementById("scannerStatus");
const scannerLog = document.getElementById("scannerLog");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");

let candidates = [];
let options = [];
let scannerInterval = null;

/* ===================== THEME ===================== */
const themeBtn = document.getElementById("themeToggle");
if (localStorage.theme === "light") document.body.classList.add("light");

themeBtn.onclick = () => {
  document.body.classList.toggle("light");
  localStorage.theme = document.body.classList.contains("light")
    ? "light"
    : "dark";
};

/* ===================== LOAD CANDIDATES ===================== */
loadBtn.onclick = async () => {
  candidatesOut.textContent = "Loading candidates...";

  try {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    candidates = data.candidates || [];

    if (!candidates.length) {
      candidatesOut.textContent = "No candidates returned.";
      return;
    }

    renderCandidates();
  } catch (err) {
    console.error("Candidates error:", err);
    candidatesOut.textContent =
      "❌ Failed to load candidates. Backend unreachable.";
  }
};

function renderCandidates() {
  const min = Number(minPrice.value) || 0;
  const max = Number(maxPrice.value) || Infinity;

  const filtered = candidates.filter(
    c => c.price >= min && c.price <= max
  );

  candidatesOut.innerHTML = filtered
    .map(
      c => `
      <div>
        <a href="#" onclick="loadOptions('${c.symbol}')">
          ${c.symbol}
        </a> — $${c.price}
      </div>`
    )
    .join("");
}

/* ===================== LOAD OPTIONS ===================== */
window.loadOptions = async symbol => {
  optionsOut.textContent = "Loading options...";

  try {
    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    options = data.options || [];

    if (!options.length) {
      optionsOut.textContent = "No options found.";
      return;
    }

    renderOptions();
  } catch (err) {
    console.error("Options error:", err);
    optionsOut.textContent = "❌ Options unavailable.";
  }
};

function renderOptions() {
  optionsOut.innerHTML = options
    .slice(0, 20)
    .map(
      o => `
      <div class="${o.type}">
        ${o.type.toUpperCase()} | 
        Strike ${o.strike} | 
        Exp ${o.expiration} | 
        Ask $${o.ask}
      </div>`
    )
    .join("");
}

/* ===================== SCANNER (FIXED) ===================== */
scannerBtn.onclick = () => {
  if (scannerInterval) {
    clearInterval(scannerInterval);
    scannerInterval = null;
    scannerStatus.textContent = "Stopped";
    return;
  }

  scannerStatus.textContent = "Running";

  scannerInterval = setInterval(async () => {
    try {
      await loadBtn.click();
      scannerLog.textContent =
        "Scan OK @ " + new Date().toLocaleTimeString();
    } catch {
      scannerLog.textContent =
        "Scanner paused (backend offline)";
      clearInterval(scannerInterval);
      scannerInterval = null;
      scannerStatus.textContent = "Stopped";
    }
  }, 60000);
};

/* ===================== STRATEGY BUILDER ===================== */
/*
⚠️ Strategy builder NOT IMPLEMENTED YET
Buttons should be disabled in HTML
This prevents fake broken UI
*/
console.warn("Strategy Builder not wired yet");
