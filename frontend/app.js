console.log("Frontend loaded");

/* ===========================
   GLOBAL STATE
=========================== */
let candidatesCache = [];
let currentOptions = [];
let currentSymbol = "";
let currentPrice = null;
let selectedOption = null;

let watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
let savedTrades = JSON.parse(localStorage.getItem("savedTrades") || "[]");
let priceAlerts = JSON.parse(localStorage.getItem("priceAlerts") || "[]");

/* ===========================
   STORAGE
=========================== */
function saveState() {
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
  localStorage.setItem("savedTrades", JSON.stringify(savedTrades));
  localStorage.setItem("priceAlerts", JSON.stringify(priceAlerts));
}

/* ===========================
   WATCHLIST
=========================== */
function renderWatchlist() {
  const out = document.getElementById("savedTrades");
  if (!out) return;

  if (watchlist.length === 0) {
    out.innerHTML = "Watchlist empty";
    return;
  }

  let html = `<table><tr><th>Symbol</th><th></th></tr>`;
  watchlist.forEach((s, i) => {
    html += `
      <tr>
        <td>${s}</td>
        <td><button data-i="${i}" class="remove-watch">✖</button></td>
      </tr>`;
  });
  html += "</table>";
  out.innerHTML = html;

  document.querySelectorAll(".remove-watch").forEach(btn => {
    btn.onclick = () => {
      watchlist.splice(btn.dataset.i, 1);
      saveState();
      renderWatchlist();
    };
  });
}

/* ===========================
   ALERT CHECK
=========================== */
function checkAlerts(symbol, price) {
  priceAlerts.forEach(a => {
    if (
      a.symbol === symbol &&
      ((a.type === "above" && price >= a.price) ||
       (a.type === "below" && price <= a.price))
    ) {
      alert(`🔔 ALERT: ${symbol} ${a.type} ${a.price}`);
      a.triggered = true;
    }
  });

  priceAlerts = priceAlerts.filter(a => !a.triggered);
  saveState();
}

/* ===========================
   MAIN
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const optionsOutput = document.getElementById("optionsOutput");

  /* ===========================
     RENDER CANDIDATES
  =========================== */
  function renderCandidates(data) {
    let html = `
      <table>
        <tr><th>Symbol</th><th>Price</th></tr>
    `;

    data.forEach(c => {
      html += `
        <tr class="candidate-row"
            data-symbol="${c.symbol}"
            data-price="${c.price}">
          <td>${c.symbol}</td>
          <td>${c.price}</td>
        </tr>
      `;
    });

    html += "</table>";
    candidatesOutput.innerHTML = html;

    document.querySelectorAll(".candidate-row").forEach(row => {
      row.onclick = () => openOptions(row.dataset.symbol, row.dataset.price);
      enableSwipe(row);
    });
  }

  /* ===========================
     OPTIONS LOAD
  =========================== */
  async function openOptions(symbol, price) {
    currentSymbol = symbol;
    currentPrice = parseFloat(price);
    selectedOption = null;

    checkAlerts(symbol, currentPrice);

    optionsOutput.innerHTML = "Loading options...";
    const res = await fetch(`${API_BASE}/api/v1/options/${symbol}`);
    const data = await res.json();
    currentOptions = data.options || [];

    let html = `
      <table>
        <tr><th>Type</th><th>Strike</th><th>Exp</th><th>Ask</th></tr>
    `;

    currentOptions.slice(0, 10).forEach(o => {
      html += `
        <tr>
          <td>${o.type}</td>
          <td>${o.strike}</td>
          <td>${o.expiration}</td>
          <td>${o.ask}</td>
        </tr>
      `;
    });

    html += "</table>";
    optionsOutput.innerHTML = html;
  }

  /* ===========================
     SWIPE GESTURES
  =========================== */
  function enableSwipe(el) {
    let startX = 0;

    el.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });

    el.addEventListener("touchend", e => {
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;

      // 👉 Swipe RIGHT = open options
      if (deltaX > 60) {
        openOptions(el.dataset.symbol, el.dataset.price);
      }

      // 👈 Swipe LEFT = add to watchlist
      if (deltaX < -60) {
        const s = el.dataset.symbol;
        if (!watchlist.includes(s)) {
          watchlist.push(s);
          saveState();
          renderWatchlist();
          alert(`⭐ Added ${s} to watchlist`);
        }
      }
    });
  }

  /* ===========================
     LOAD CANDIDATES
  =========================== */
  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";
    const res = await fetch(`${API_BASE}/api/v1/candidates`);
    const data = await res.json();

    candidatesCache = data.candidates || [];
    renderCandidates(candidatesCache);

    candidatesCache.forEach(c => checkAlerts(c.symbol, c.price));
  };

  renderWatchlist();
});
