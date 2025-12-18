console.log("Frontend loaded");

document.addEventListener("DOMContentLoaded", () => {
  const symbolBtn = document.getElementById("symbolBtn");
  const candidatesBtn = document.getElementById("candidatesBtn");
  const symbolInput = document.getElementById("symbolInput");
  const symbolOutput = document.getElementById("symbolOutput");
  const candidatesOutput = document.getElementById("candidatesOutput");

  if (!symbolBtn || !candidatesBtn || !symbolInput || !symbolOutput || !candidatesOutput) {
    console.error("Required DOM elements not found");
    return;
  }

  symbolBtn.addEventListener("click", async () => {
    const symbol = symbolInput.value.trim();
    if (!symbol) {
      symbolOutput.textContent = "Enter a symbol";
      return;
    }

    symbolOutput.textContent = "Loading...";

    try {
      const res = await fetch(
        `${window.API_BASE_URL}/api/v1/symbol/${symbol}`
      );
      if (!res.ok) throw new Error("Backend error");

      const data = await res.json();
      symbolOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      symbolOutput.textContent = "Error fetching option chain";
      console.error(err);
    }
  });

  candidatesBtn.addEventListener("click", async () => {
    candidatesOutput.textContent = "Loading...";

    try {
      const res = await fetch(
        `${window.API_BASE_URL}/api/v1/candidates`
      );
      if (!res.ok) throw new Error("Backend error");

      const data = await res.json();
      candidatesOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      candidatesOutput.textContent = "Error fetching candidates";
      console.error(err);
    }
  });
});
