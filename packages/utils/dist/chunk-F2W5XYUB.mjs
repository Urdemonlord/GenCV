// browser.ts
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

export {
  saveToLocalStorage,
  loadFromLocalStorage
};
