document.addEventListener("DOMContentLoaded", () => {
  console.log("Frontend loaded");

  const symbolInput = document.getElementById("symbolInput");
  const symbolBtn = document.getElementById("symbolBtn");
  const symbolOutput = document.getElementById("symbolOutput");

  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");

  // ---------- SYMBOL LOOKUP ----------
  symbolBtn.addEventListener("click", async () => {
    const symbol = symbolInput.value.trim();
    if (!symbol) {
      symbolOutput.textContent = "Enter a symbol";
      return;
    }

    symbolOutput.textContent = "Loading...";

    try {
      const res = await fetch(
        `https://penny-option-backend.onrender.com/api/v1/symbol/${symbol}`
      );
      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error(err);
      symbolOutput.textContent = "Error fetching symbol data";
    }
  });

  // ---------- CANDIDATES ----------
  candidatesBtn.addEventListener("click", async () => {
    candidatesOutput.textContent = "Loading...";

    try {
      const res = await fetch(
        "https://penny-option-backend.onrender.com/api/v1/candidates"
      );

      const data = await res.json();
      console.log("Candidates data:", data);

      if (!Array.isArray(data) || data.length === 0) {
        candidatesOutput.textContent = "No candidates returned";
        return;
      }

      let html = `
        <table border="1" cellpadding="6">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.forEach(row => {
        html += `
          <tr>
            <td>${row.symbol}</td>
            <td>${row.price}</td>
          </tr>
        `;
      });

      html += "</tbody></table>";
      candidatesOutput.innerHTML = html;

    } catch (err) {
      console.error(err);
      candidatesOutput.textContent = "Error loading candidates";
    }
  });
});
