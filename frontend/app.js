console.log("Frontend loaded");

let candidatesCache = [];

document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");
  const sortSymbolBtn = document.getElementById("sortSymbol");
  const sortPriceBtn = document.getElementById("sortPrice");

  function renderTable(data) {
    let html = `
      <table border="1" cellpadding="6" cellspacing="0">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach(c => {
      html += `
        <tr>
          <td>${c.symbol}</td>
          <td>${c.price}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    candidatesOutput.innerHTML = html;
  }

  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();
      candidatesCache = data.candidates || [];

      if (candidatesCache.length === 0) {
        candidatesOutput.innerHTML = "No candidates returned";
        return;
      }

      renderTable(candidatesCache);

    } catch (err) {
      console.error(err);
      candidatesOutput.innerHTML = "Error loading candidates";
    }
  };

  sortSymbolBtn.onclick = () => {
    if (candidatesCache.length === 0) return;
    candidatesCache.sort((a, b) => a.symbol.localeCompare(b.symbol));
    renderTable(candidatesCache);
  };

  sortPriceBtn.onclick = () => {
    if (candidatesCache.length === 0) return;
    candidatesCache.sort((a, b) => a.price - b.price);
    renderTable(candidatesCache);
  };
});
