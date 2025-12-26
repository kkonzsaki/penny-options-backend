console.log("Frontend loaded");

let chart = null;

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
   DOM READY
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
    let html = `<table><tr><th>Symbol</th><th>Price</th></tr>`;
    data.forEach(c => {
      html += `
        <tr>
          <td><a href="#" class="symbol-link" data-symbol="${c.symbol}">${c.symbol}</a></td>
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

  function renderOptions() {
    let filtered = currentFilter === "all"
      ? optionsCache
      : optionsCache.filter(o => o.type === currentFilter);

    let html = `<table>
      <tr><th>Type</th><th>Strike</th><th>Exp</th><th>Ask</th></tr>`;

    filtered.slice(0, 20).forEach(o => {
      html += `
        <tr class="${o.type}">
          <td>
            <a href="#" class="option-link"
               data-type="${o.type}"
               data-strike="${o.strike}"
               data-ask="${o.ask}">
               ${o.type.toUpperCase()}
            </a>
          </td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
        </tr>`;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;

    document.querySelectorAll(".option-link").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        drawPayoff(link.dataset);
      };
    });
  }

  async function loadOptions(symbol) {
    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
    const data = await res.json();
    optionsCache = data.options || [];
    renderOptions();
  }

  function drawPayoff(o) {
    const strike = Number(o.strike);
    const premium = Number(o.ask);
    const isCall = o.type === "call";

    const prices = [];
    const pnl = [];

    for (let p = strike * 0.7; p <= strike * 1.3; p += strike * 0.02) {
      prices.push(p.toFixed(2));
      let value = isCall
        ? Math.max(p - strike, 0) - premium
        : Math.max(strike - p, 0) - premium;
      pnl.push((value * 100).toFixed(2));
    }

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("payoffChart"), {
      type: "line",
      data: {
        labels: prices,
        datasets: [{
          label: "P/L at Expiration ($)",
          data: pnl,
          borderColor: isCall ? "#22c55e" : "#ef4444",
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        plugins: { legend: { display: false }},
        scales: {
          x: { title: { display: true, text: "Stock Price" }},
          y: { title: { display: true, text: "Profit / Loss ($)" }}
        }
      }
    });
  }

  showAll.onclick = () => { currentFilter = "all"; renderOptions(); };
  showCalls.onclick = () => { currentFilter = "call"; renderOptions(); };
  showPuts.onclick = () => { currentFilter = "put"; renderOptions(); };

  candidatesBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  applyFilter.onclick = () => {
    const min = Number(minPrice.value) || 0;
    const max = Number(maxPrice.value) || Infinity;
    renderCandidates(candidatesCache.filter(c => c.price >= min && c.price <= max));
  };
});
