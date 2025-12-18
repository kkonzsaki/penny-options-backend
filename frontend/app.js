console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  // Grab DOM elements
  const symbolInput = document.getElementById("symbolInput");
  const symbolOutput = document.getElementById("symbolOutput");
  const candidatesOutput = document.getElementById("candidatesOutput");

  // Validate DOM
  if (!symbolInput || !symbolOutput || !candidatesOutput) {
    console.error("Required DOM elements not found");
    return;
  }

  console.log("DOM elements found");

  // ============================
  // 🔍 FETCH OPTIONS CHAIN
  // ============================
  window.fetchSymbol = async function () {
    const ticker = symbolInput.value.trim().toUpperCase();

    if (!ticker) {
      symbolOutput.textContent = "⚠️ Please enter a ticker symbol";
      return;
    }

    symbolOutput.textContent = "⏳ Loading options chain...";

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/symbol/${ticker}`
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error(err);
      symbolOutput.textContent =
        "❌ Failed to fetch option chain\n" + err.message;
    }
  };

  // ============================
  // 📋 FETCH PENNY CANDIDATES
  // ============================
  window.fetchCandidates = async function () {
    candidatesOutput.textContent = "⏳ Loading candidates...";

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/candidates`
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      candidatesOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error(err);
      candidatesOutput.textContent =
        "❌ Failed to load candidates\n" + err.message;
    }
  };
});
