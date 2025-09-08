import "./chunk-XLSJYXZ6.mjs";
import "./chunk-F2W5XYUB.mjs";
import {
  calculateCVScore,
  exportToJSON,
  formatDate,
  generateId,
  importFromJSON,
  sanitizeInput,
  validateEmail,
  validatePhone
} from "./chunk-3G3TWQ46.mjs";

// server.ts
var saveToLocalStorage = (key, data) => {
  console.warn("localStorage is not available in server environment");
};
var loadFromLocalStorage = (key) => {
  console.warn("localStorage is not available in server environment");
  return null;
};
export {
  calculateCVScore,
  exportToJSON,
  formatDate,
  generateId,
  importFromJSON,
  loadFromLocalStorage,
  sanitizeInput,
  saveToLocalStorage,
  validateEmail,
  validatePhone
};
