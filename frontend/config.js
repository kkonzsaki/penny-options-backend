/**
 * Global configuration for Penny Options Scout frontend
 * This file MUST load before app.js
 */

const CONFIG = {
  // 🔗 Render backend service URL (NO trailing slash)
// config.js
const API_BASE_URL = "https:///penny-options-backend.onrender.com";

console.log("Config loaded:", API_BASE_URL);


  // ⏱ Request timeout (ms)
  REQUEST_TIMEOUT: 15000,

  // 📌 API endpoints
  ENDPOINTS: {
    HEALTH: "/health",
    CANDIDATES: "/api/v1/candidates",
    SYMBOL: "/api/v1/symbol" // usage: /api/v1/symbol/AAPL
  },

  // 🧪 Debug mode (set false for production)
  DEBUG: true
};

/**
 * Helper to build full API URLs safely
 */
function apiUrl(path) {
  return `${CONFIG.API_BASE_URL}${path}`;
}
