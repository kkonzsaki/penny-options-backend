document.addEventListener("DOMContentLoaded", () => {
  const loadBtn = document.getElementById("loadCandidates");
  const output = document.getElementById("output");

  loadBtn.addEventListener("click", async () => {
    output.innerHTML = "Loading...";

    try {
      const res = await fetch(
        "https://penny-option-backend.onrender.com/api/v1/candidates"
      );

      const data = await res.json();
      console.log("Candidates data:", data);

      if (!Array.isArray(data) || data.length === 0) {
        output.innerHTML = "No candidates returned";
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
      output.innerHTML = html;

    } catch (err) {
      console.error(err);
      output.innerHTML = "Error loading candidates";
    }
  });
});
