console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  const symbolInput = document.getElementById("symbolInput");
  const symbolBtn = document.getElementById("symbolBtn");
  const symbolOutput = document.getElementById("symbolOutput");

  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");

  symbolBtn.addEventListener("click", async () => {
    const ticker = symbolInput.value.trim();
    if (!ticker) return;

    symbolOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/symbol/${ticker}`);
      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      symbolOutput.textContent = "Error fetching symbol data";
    }
  });

  candidatesBtn.addEventListener("click", async () => {
    candidatesOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/candidates`);
      const data = await res.json();
      candidatesOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      candidatesOutput.textContent = "Error fetching candidates";
    }
  });
});
