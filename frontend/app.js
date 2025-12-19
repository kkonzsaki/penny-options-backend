console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  const symbolInput = document.getElementById("symbolInput");
  const symbolBtn = document.getElementById("symbolBtn");
  const symbolOutput = document.getElementById("symbolOutput");

  const candidatesBtn = document.getElementById("candidatesBtn");
  const candidatesOutput = document.getElementById("candidatesOutput");

  if (!symbolInput || !symbolBtn || !symbolOutput || !candidatesBtn || !candidatesOutput) {
    console.error("Required DOM elements not found");
    return;
  }

  // Fetch options chain for symbol
  symbolBtn.onclick = async () => {
    const symbol = symbolInput.value.trim();
    if (!symbol) {
      symbolOutput.textContent = "Enter a symbol";
      return;
    }

    symbolOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/symbol/${symbol}`);
      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      symbolOutput.textContent = "Error fetching symbol data";
      console.error(err);
    }
  };

  // Fetch penny candidates
  candidatesBtn.onclick = async () => {
    candidatesOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/v1/candidates`);
      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      candidatesOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      candidatesOutput.textContent = "Error fetching candidates";
      console.error(err);
    }
  };
});
