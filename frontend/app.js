console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  const symbolInput = document.getElementById("symbolInput");
  const symbolOutput = document.getElementById("symbolOutput");
  const candidatesOutput = document.getElementById("candidatesOutput");

  if (!symbolInput || !symbolOutput || !candidatesOutput) {
    console.error("Required DOM elements not found");
    return;
  }

  // 🔍 OPTIONS LOOKUP
  window.fetchSymbol = async () => {
    const symbol = symbolInput.value.trim().toUpperCase();
    symbolOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/symbol/${symbol}`);
      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error(err);
      symbolOutput.textContent = "Error fetching symbol.";
    }
  };

  // 📋 CANDIDATES
  window.fetchCandidates = async () => {
    candidatesOutput.textContent = "Loading...";

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/candidates`);
      const data = await res.json();
      candidatesOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error(err);
      candidatesOutput.textContent = "Error fetching candidates.";
    }
  };
});
