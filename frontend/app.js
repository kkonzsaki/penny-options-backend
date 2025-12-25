console.log("Frontend loaded");

/* ===========================
   THEME TOGGLE
=========================== */
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
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let optionsCache = [];
let currentFilter = "all";

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

  function renderCandidates(data) {
    if (!data.length) {
      candidatesOutput.innerHTML = "No candidates";
      return;
    }

    let html = `<table><tr><th>Symbol</th><th>Price</th></tr>`;

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

    html += "</table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".symbol-link").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        loadOptions(link.dataset.symbol);
      };
    });
  }

  function renderOptions() {
    let filtered = optionsCache;

    if (currentFilter !== "all") {
      filtered = optionsCache.filter(o => o.type === currentFilter);
    }

    if (!filtered.length) {
      optionsOutput.innerHTML = "No options found";
      return;
    }

    let html = `
      <table>
        <tr>
          <th>Type</th>
          <th>Strike</th>
          <th>Expiration</th>
          <th>Ask</th>
        </tr>
    `;

    filtered.slice(0, 20).forEach(o => {
      const cls = o.type === "call" ? "call" : "put";
      html += `
        <tr class="${cls}">
          <td class="${cls}">${o.type.toUpperCase()}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
        </tr>
      `;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;
  }

  async function loadOptions(symbol) {
    optionsOutput.innerHTML = `Loading options for ${symbol}...`;
    currentFilter = "all";

    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
    const data = await res.json();
    optionsCache = data.options || [];
    renderOptions();
  }

  showAll.onclick = () => {
    currentFilter = "all";
    renderOptions();
  };

  showCalls.onclick = () => {
    currentFilter = "call";
    renderOptions();
  };

  showPuts.onclick = () => {
    currentFilter = "put";
    renderOptions();
  };

  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  applyFilter.onclick = () => {
    const min = parseFloat(minPrice.value) || 0;
    const max = parseFloat(maxPrice.value) || Infinity;
    renderCandidates(
      candidatesCache.filter(c => c.price >= min && c.price <= max)
    );
  };
});
