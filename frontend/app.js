console.log("Frontend loaded");

window.fetchSymbol = async () => {
  const symbolInput = document.getElementById("symbolInput");
  const symbolOutput = document.getElementById("symbolOutput");

  if (!symbolInput || !symbolOutput) {
    console.error("symbolInput or symbolOutput not found", {
      symbolInput,
      symbolOutput
    });
    return;
  }

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

window.fetchCandidates = async () => {
  const candidatesOutput = document.getElementById("candidatesOutput");

  if (!candidatesOutput) {
    console.error("candidatesOutput not found");
    return;
  }

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
