console.log("App loaded");

/* ======================
   STATE
====================== */
let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentPrice = 0;

let optionType = "call";
let expiration = "ALL";
let maxAskFilter = null;

let selectedLegs = [];

let savedTrades = JSON.parse(localStorage.getItem("savedTrades") || "[]");

/* ======================
   STORAGE
====================== */
function saveTrades() {
  localStorage.setItem("savedTrades", JSON.stringify(savedTrades));
  renderSavedTrades();
}

/* ======================
   SPREAD BUILDER
====================== */
function renderSpreadBuilder() {
  const out = document.getElementById("spreadBuilder");

  if (selectedLegs.length < 2) {
    out.innerHTML = "<p>Select 2 option legs to build a spread</p>";
    return;
  }

  const [buy, sell] = selectedLegs;
  const debit = (buy.ask - sell.ask) * 100;

  let maxProfit, maxLoss, breakeven;

  if (buy.type === "call") {
    breakeven = buy.strike + debit / 100;
    maxProfit = (sell.strike - buy.strike) * 100 - debit;
    maxLoss = debit;
  } else {
    breakeven = buy.strike - debit / 100;
    maxProfit = (buy.strike - sell.strike) * 100 - debit;
    maxLoss = debit;
  }

  out.innerHTML = `
    <h3>Spread Builder</h3>
    <p><b>${currentSymbol}</b></p>
    <p>Buy ${buy.type.toUpperCase()} ${buy.strike} @ ${buy.ask}</p>
    <p>Sell ${sell.type.toUpperCase()} ${sell.strike} @ ${sell.ask}</p>

    <p>Net ${debit >= 0 ? "Debit" : "Credit"}: $${Math.abs(debit).toFixed(2)}</p>
    <p>Max Profit: <span class="profit">$${maxProfit.toFixed(2)}</span></p>
    <p>Max Loss: <span class="loss">$${maxLoss.toFixed(2)}</span></p>
    <p>Breakeven: $${breakeven.toFixed(2)}</p>

    <button id="saveSpread">Save Spread</button>
  `;

  document.getElementById("saveSpread").onclick = () => {
    savedTrades.push({
      symbol: currentSymbol,
      strategy: "Spread",
      buy,
      sell,
      debit
    });
    saveTrades();
    selectedLegs = [];
    out.innerHTML = "";
  };
}

/* ======================
   OPTIONS
====================== */
function renderOptions() {
  const out = document.getElementById("optionsOutput");

  const filtered = currentOptions.filter(o => {
    if (o.type !== optionType) return false;
    if (expiration !== "ALL" && o.expiration !== expiration) return false;
    if (maxAskFilter && o.ask > maxAskFilter) return false;
    return true;
  });

  if (!filtered.length) {
    out.innerHTML = "No options found";
    return;
  }

  let html = `
    <table>
      <tr>
        <th></th>
        <th>Type</th>
        <th>Strike</th>
        <th>Exp</th>
        <th>Ask</th>
      </tr>
  `;

  filtered.slice(0, 20).forEach((o, i) => {
    html += `
      <tr data-i="${i}" class="opt">
        <td><input type="checkbox"></td>
        <td>${o.type}</td>
        <td>${o.strike}</td>
        <td>${o.expiration}</td>
        <td>${o.ask}</td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".opt").forEach((row, i) => {
    row.onclick = () => {
      const opt = filtered[i];
      if (selectedLegs.length < 2) {
        selectedLegs.push(opt);
      } else {
        selectedLegs = [opt];
      }
      renderSpreadBuilder();
    };
  });
}

/* ======================
   LOAD OPTIONS
====================== */
async function loadOptionsChain(e) {
  e.preventDefault();
  currentSymbol = e.target.dataset.symbol;
  currentPrice = parseFloat(e.target.dataset.price);

  const res = await fetch(`${API_BASE}/api/v1/options/${currentSymbol}`);
  const data = await res.json();
  currentOptions = data.options || [];

  expirationSelect.innerHTML =
    `<option value="ALL">All Expirations</option>` +
    [...new Set(currentOptions.map(o => o.expiration))]
      .map(e => `<option value="${e}">${e}</option>`).join("");

  selectedLegs = [];
  renderOptions();
}

/* ======================
   SAVED TRADES
====================== */
function renderSavedTrades() {
  const out = document.getElementById("savedTrades");

  if (!savedTrades.length) {
    out.innerHTML = "No saved trades";
    return;
  }

  let html = `
    <table>
      <tr>
        <th>Symbol</th>
        <th>Strategy</th>
        <th>Details</th>
        <th>Remove</th>
      </tr>
  `;

  savedTrades.forEach((t, i) => {
    html += `
      <tr>
        <td>${t.symbol}</td>
        <td>${t.strategy}</td>
        <td>
          Buy ${t.buy.strike} / Sell ${t.sell.strike}
        </td>
        <td><button data-i="${i}">X</button></td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  out.querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      savedTrades.splice(b.dataset.i, 1);
      saveTrades();
    };
  });
}

/* ======================
   INIT
====================== */
document.addEventListener("DOMContentLoaded", () => {
  renderSavedTrades();

  candidatesBtn.onclick = async () => {
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();
    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);
  };

  applyFilter.onclick = () => {
    const min = parseFloat(minPrice.value || 0);
    const max = parseFloat(maxPrice.value || Infinity);
    renderCandidates(candidatesCache.filter(c => c.price >= min && c.price <= max));
  };

  callsBtn.onclick = () => {
    optionType = "call";
    callsBtn.classList.add("active");
    putsBtn.classList.remove("active");
    renderOptions();
  };

  putsBtn.onclick = () => {
    optionType = "put";
    putsBtn.classList.add("active");
    callsBtn.classList.remove("active");
    renderOptions();
  };

  expirationSelect.onchange = () => {
    expiration = expirationSelect.value;
    renderOptions();
  };

  maxAsk.oninput = () => {
    maxAskFilter = maxAsk.value ? parseFloat(maxAsk.value) : null;
    renderOptions();
  };
});

/* ======================
   CANDIDATES
====================== */
function renderCandidates(list) {
  const out = document.getElementById("candidatesOutput");

  let html = `<table><tr><th>Symbol</th><th>Price</th></tr>`;
  list.forEach(c => {
    html += `
      <tr>
        <td>
          <a href="#" class="symbol-link"
            data-symbol="${c.symbol}"
            data-price="${c.price}">
            ${c.symbol}
          </a>
        </td>
        <td>${c.price}</td>
      </tr>
    `;
  });

  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".symbol-link")
    .forEach(l => l.onclick = loadOptionsChain);
}
