// app.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("Frontend loaded");

  const fetchBtn = document.getElementById("fetchBtn");
  const tickerInput = document.getElementById("tickerInput");
  const output = document.getElementById("output");

  if (!fetchBtn || !tickerInput || !output) {
    console.error("Required DOM elements not found");
    return;
  }

  fetchBtn.addEventListener("click", async () => {
    const ticker = tickerInput.value.trim().toUpperCase();

    if (!ticker) {
      output.textContent = "Please enter a ticker symbol.";
      return;
    }

    output.textContent = "Fetching option chain...";

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/symbol/${ticker}`
      );

      const data = await response.json();

      if (!response.ok) {
        output.textContent =
          data.error || "Failed to fetch option chain.";
        return;
      }

      output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
      console.error("Fetch error:", error);
      output.textContent = "Error connecting to backend.";
    }
  });
});
