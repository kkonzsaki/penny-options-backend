console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  const symbolInput = document.getElementById("symbolInput");
  const symbolBtn = document.getElementById("symbolBtn");
  const symbolOutput = document.getElementById("symbolOutput");

  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");

  if (!symbolBtn || !candidatesBtn || !candidatesOutput) {
    console.error("Missing required DOM elements");
    return;
  }

  // ===============================
  // Fetch options chain for symbol
  // ===============================
  symbolBtn.onclick = async () => {
    const symbol = symbolInput.value.trim();
    if (!symbol) {
      symbolOutput.textContent = "Enter a symbol";
      return;
    }

    symbolOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/symbol/${symbol}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error("Symbol fetch error:", err);
      symbolOutput.textContent = "Error fetching symbol data";
    }
  };

  // ===============================
  // Fetch penny candidates
  // ===============================
  candidatesBtn.onclick = async () => {
    candidatesOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log("Candidates data:", data);

      if (!Array.isArray(data) || data.length === 0) {
        candidatesOutput.textContent = "No candidates returned";
        return;
      }

      // Build table
      let table = `<table border="1" cellpadding="6" cellspacing="0">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Strike</th>
            <th>Expiration</th>
            <th>Price</th>
            <th>Volume</th>
            <th>Open Interest</th>
          </tr>
        </thead>
        <tbody>`;

      data.forEach(c => {
        table += `
          <tr>
            <td>${c.symbol ?? "-"}</td>
            <td>${c.strike ?? "-"}</td>
            <td>${c.expiration ?? "-"}</td>
            <td>${c.price ?? "-"}</td>
            <td>${c.volume ?? "-"}</td>
            <td>${c.open_interest ?? "-"}</td>
          </tr>`;
      });

      table += `</tbody></table>`;

      candidatesOutput.innerHTML = table;

    } catch (err) {
      console.error("Candidates fetch error:", err);
      candidatesOutput.textContent = "Error fetching candidates";
    }
  };
});
