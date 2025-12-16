import { API_BASE_URL } from "./config.js";

const output = document.getElementById("output");

function render(data) {
  output.textContent = JSON.stringify(data, null, 2);
}

// -------------------------
// Health Check
// -------------------------
async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  render(await res.json());
}

// -------------------------
// Penny Candidates
// -------------------------
async function loadCandidates() {
  const res = await fetch(`${API_BASE_URL}/api/v1/candidates`);
  render(await res.json());
}

// -------------------------
// Options Chain
// -------------------------
async function loadSymbol() {
  const symbol = document.getElementById("symbol").value.trim();
  if (!symbol) return alert("Enter a symbol");

  const res = await fetch(
    `${API_BASE_URL}/api/v1/symbol/${symbol}`
  );
  render(await res.json());
}

// -------------------------
// Button Wiring
// -------------------------
window.checkHealth = checkHealth;
window.loadCandidates = loadCandidates;
window.loadSymbol = loadSymbol;
