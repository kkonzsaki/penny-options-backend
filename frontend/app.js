// app.js
console.log("Frontend loaded");

async function fetchCandidates() {
  const output = document.getElementById("candidatesOutput");
  output.textContent = "Loading candidates...";

  try {
    const res = await fetch(`${window.API_BASE_URL}/api/v1/candidates`);
    if (!res.ok) throw new Error("Backend error");

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = "Error fetching candidates";
    console.error(err);
  }
}

async function fetchSymbol() {
  const symbol = document.getElementById("symbolInput").value.trim();
  const output = document.getElementById("symbolOutput");

  if (!symbol) {
    output.textContent = "Enter a symbol";
    return;
  }

  output.textContent = "Loading option chain...";

  try {
    const res = await fetch(
      `${window.API_BASE_URL}/api/v1/symbol/${symbol}`
    );
    if (!res.ok) throw new Error("Backend error");

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output.textContent = "Error fetching option chain";
    console.error(err);
  }
}

// Expose to HTML buttons
window.fetchCandidates = fetchCandidates;
window.fetchSymbol = fetchSymbol;
