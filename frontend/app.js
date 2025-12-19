console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  const symbolInput = document.getElementById("symbolInput");
  const symbolBtn = document.getElementById("symbolBtn");
  const symbolOutput = document.getElementById("symbolOutput");

  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");

  // ---- SYMBOL LOOKUP ----
  symbolBtn.onclick = async () => {
    const symbol = symbolInput.value.trim();
    if (!symbol) {
      symbolOutput.textContent = "Enter a symbol";
      return;
    }

    symbolOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/symbol/${symbol}`);
      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch {
      symbolOutput.textContent = "Error fetching symbol data";
    }
  };

  // ---- CANDIDATES TABLE ----
  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        candidatesOutput.textContent = "No candidates found";
        return;
      }

      const columns = Object.keys(data[0]);

      let table = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;color:#e5e7eb">
        <thead>
          <tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${data
            .map(
              row =>
                `<tr>${columns
                  .map(col => `<td>${row[col]}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>`;

      candidatesOutput.innerHTML = table;
    } catch {
      candidatesOutput.textContent = "Error fetching candidates";
    }
  };
});
