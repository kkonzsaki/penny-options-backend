console.log("Frontend loaded");

let candidatesCache = [];

document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");

  const minPriceInput = document.getElementById("minPrice");
  const maxPriceInput = document.getElementById("maxPrice");
  const applyFilterBtn = document.getElementById("applyFilter");

  function renderTable(data) {
    if (data.length === 0) {
      candidatesOutput.innerHTML = "No candidates match filter";
      return;
    }

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
      renderTable(candidatesCache);

    } catch (err) {
      console.error(err);
      candidatesOutput.innerHTML = "Error loading candidates";
    }
  };

  applyFilterBtn.onclick = () => {
    if (candidatesCache.length === 0) return;

    const min = parseFloat(minPriceInput.value) || 0;
    const max = parseFloat(maxPriceInput.value) || Infinity;

    const filtered = candidatesCache.filter(c =>
      c.price >= min && c.price <= max
    );

    renderTable(filtered);
  };
});
