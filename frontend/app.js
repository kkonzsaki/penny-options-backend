console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  if (typeof API_BASE === "undefined") {
    console.error("API_BASE is not defined. config.js failed to load.");
    return;
  }

  const symbolInput = document.getElementById("symbolInput");
  const symbolBtn = document.getElementById("symbolBtn");
  const symbolOutput = document.getElementById("symbolOutput");
  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");

  if (!symbolInput || !symbolBtn || !symbolOutput || !candidatesBtn || !candidatesOutput) {
    console.error("Required DOM elements not found");
    return;
  }

  symbolBtn.addEventListener("click", async () => {
    const symbol = symbolInput.value.trim();
    symbolOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/symbol/${symbol}`);
      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error(err);
      symbolOutput.textContent = "Error fetching symbol";
    }
  });

  candidatesBtn.addEventListener("click", async () => {
    candidatesOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      const data = await res.json();
      candidatesOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error(err);
      candidatesOutput.textContent = "Error fetching candidates";
    }
  });
});
