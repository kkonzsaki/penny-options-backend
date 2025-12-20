console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");

  candidatesBtn.onclick = async () => {
    candidatesOutput.innerHTML = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();
      console.log("Candidates data:", data);

      if (!data.candidates || data.candidates.length === 0) {
        candidatesOutput.innerHTML = "No candidates returned";
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

      data.candidates.forEach(c => {
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

    } catch (err) {
      console.error(err);
      candidatesOutput.innerHTML = "Error loading candidates";
    }
  };
});
