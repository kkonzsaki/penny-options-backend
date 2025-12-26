/* ===========================
   GLOBAL CONFIG
=========================== */

// CHANGE THIS if backend is remote
const API_BASE = "http://localhost:5000";

// Scanner settings
const SCANNER_INTERVAL_MS = 15000;

// Validation
if (!API_BASE) {
  console.error("API_BASE is not defined");
}
