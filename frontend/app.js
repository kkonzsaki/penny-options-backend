console.log("App loaded");

const candidatesDiv = document.getElementById("candidates");
const optionsDiv = document.getElementById("options");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");

let candidates = [];
let options = [];
let filter = "all";
let scanner = null;
let chart = null;

/* ===================== THEME ===================== */
const themeBtn = document.getElementById("themeToggle");

if (localStorage.theme === "light") {
  document.body.classList.add("light");
}

themeBtn.onclick = () => {
  document.body.classList.toggle("light");
  localStorage.theme = document.body.classList.contains("light")
    ? "light"
    : "dark";
};

/* ===================== LOAD CANDIDATES ===================== */
document.getElementById("loadCandidates").onclick = async () => {
  candidatesDiv.textContent = "Loading candidates...";

  try {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    candidates = Array.isArray(data.candidates) ? data.candidates : [];

    if (candidates.length === 0) {
      candidatesDiv.textContent = "No candidates returned.";
      return;
    }

    renderCandidates();
  } catch (err) {
    console.error("Candidate load failed:", err);
    candidatesDiv.textContent = "Failed to load candidates.";
  }
};

function renderCandidates() {
  const min = Number(minPriceInput.value) || 0;
  const max = Number(maxPriceInput.value) || Infinity;

  const filtered = candidates.filter(
    c => c.price >= min && c.price <= max
  );

  if (filtered.length === 0) {
    candidatesDiv.textContent = "No candidates match filters.";
    return;
  }

  candidatesDiv.innerHTML = filtered
    .map(
      c => `
      <div>
        <a href="#" onclick="loadOptions('${c.symbol}')">
          ${c.symbol}
        </a>
        — $${c.price}
      </div>
    `
    )
    .join("");
}

/* ===================== LOAD OPTIONS ===================== */
window.loadOptions = async symbol => {
  optionsDiv.textContent = "Loading options...";

  try {
    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    options = Array.isArray(data.options) ? data.options : [];

    if (options.length === 0) {
      optionsDiv.textContent = "No options found.";
      return;
    }

    renderOptions();
  } catch (err) {
    console.error("Options load failed:", err);
    optionsDiv.textContent = "Options unavailable.";
  }
};

window.filterType = type => {
  filter = type;
  renderOptions();
};

function renderOptions() {
  const filtered =
    filter === "all" ? options : options.filter(o => o.type === filter);

  optionsDiv.innerHTML = filtered
    .map(
      o => `
      <div class="${o.type}">
        ${o.type.toUpperCase()} 
        Strike ${o.strike} 
        Exp ${o.expiration}
        — $${o.ask}
      </div>
    `
    )
    .join("");

  if (filtered[0]) drawPayoff(filtered[0]);
}

/* ===================== PAYOFF CHART ===================== */
function drawPayoff(option) {
  const canvas = document.getElementById("payoffChart");
  if (!canvas) return;

  const prices = [];
  const pnl = [];

  for (
    let p = option.strike * 0.7;
    p <= option.strike * 1.3;
    p += option.strike * 0.02
  ) {
    prices.push(p.toFixed(2));
    pnl.push(
      option.type === "call"
        ? Math.max(0, p - option.strike) - option.ask
        : Math.max(0, option.strike - p) - option.ask
    );
  }

  if (chart) chart.destroy();

  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: prices,
      datasets: [
        {
          label: "P/L",
          data: pnl
        }
      ]
    }
  });
}

/* ===================== SCANNER (FIXED LOOP) ===================== */
document.getElementById("scannerToggle").onclick = () => {
  const status = document.getElementById("scannerStatus");

  if (scanner) {
    clearInterval(scanner);
    scanner = null;
    status.textContent = "Stopped";
    return;
  }

  status.textContent = "Running";

  scanner = setInterval(() => {
    document.getElementById("loadCandidates").click();
    document.getElementById("scannerLog").textContent =
      "Scan @ " + new Date().toLocaleTimeString();
  }, 60000);
};
