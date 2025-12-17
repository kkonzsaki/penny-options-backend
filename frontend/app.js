// app.js
console.log("Frontend loaded");

// Ensure DOM is ready before running
document.addEventListener("DOMContentLoaded", () => {

  const symbolInput = document.getElementById("symbolInput");
  const symbolOutput = document.getElementById("symbolOutput");
  const candidatesOutput = document.getElementById("candidatesOutput");

  if (!symbolInput || !symbolOutput || !candidatesOutput) {
    console.error("Required DOM elements not found");
    return;
  }

  // Fetch penny candidates
  window.fetchCandidates = async function () {
    candidatesOutput.textContent = "Loading candidates...";

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/candidates`);
      const data = await res.json();
      candidatesOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      candidatesOutput.textContent = "Error loading candidates";
      console.error(err);
    }
  };

  // Fetch options chain for a symbol
  window.fetchSymbol = async function () {
    const symbol = symbolInput.value.trim().toUpperCase();

    if (!symbol) {
      symbolOutput.textContent = "Please enter a symbol";
      return;
    }

    symbolOutput.textContent = "Loading options chain...";

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/symbol/${symbol}`);
      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      symbolOutput.textContent = "Error loading symbol data";
      console.error(err);
    }
  };

});
