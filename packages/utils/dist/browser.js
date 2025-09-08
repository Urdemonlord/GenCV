"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// browser.ts
var browser_exports = {};
__export(browser_exports, {
  loadFromLocalStorage: () => loadFromLocalStorage,
  saveToLocalStorage: () => saveToLocalStorage
});
module.exports = __toCommonJS(browser_exports);
var saveToLocalStorage = (key, data) => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  } else {
    console.warn("localStorage is not available");
  }
};
var loadFromLocalStorage = (key) => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  } else {
    console.warn("localStorage is not available");
    return null;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loadFromLocalStorage,
  saveToLocalStorage
});
