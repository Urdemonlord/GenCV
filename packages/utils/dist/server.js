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

// server.ts
var server_exports = {};
__export(server_exports, {
  calculateCVScore: () => calculateCVScore,
  exportToJSON: () => exportToJSON,
  formatDate: () => formatDate,
  generateId: () => generateId,
  importFromJSON: () => importFromJSON,
  loadFromLocalStorage: () => loadFromLocalStorage,
  sanitizeInput: () => sanitizeInput,
  saveToLocalStorage: () => saveToLocalStorage,
  validateEmail: () => validateEmail,
  validatePhone: () => validatePhone
});
module.exports = __toCommonJS(server_exports);

// shared.ts
var idCounter = 0;
var generateId = () => {
  idCounter += 1;
  return `id_${Date.now()}_${idCounter}`;
};
var formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};
var validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
var validatePhone = (phone) => {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone.replace(/[\s\-\(\)]/g, ""));
};
var calculateCVScore = (cvData) => {
  const scores = {
    personalInfo: 0,
    summary: 0,
    experience: 0,
    education: 0,
    skills: 0
  };
  const suggestions = [];
  const personalInfo = cvData.personalInfo;
  let personalScore = 0;
  if (personalInfo.fullName) personalScore += 25;
  if (personalInfo.email && validateEmail(personalInfo.email)) personalScore += 25;
  if (personalInfo.phone && validatePhone(personalInfo.phone)) personalScore += 25;
  if (personalInfo.location) personalScore += 25;
  scores.personalInfo = personalScore;
  if (personalScore < 100) {
    suggestions.push("Complete all personal information fields");
  }
  const summary = cvData.professionalSummary;
  if (summary && summary.length >= 50) {
    scores.summary = summary.length >= 100 ? 100 : summary.length / 100 * 100;
  } else {
    suggestions.push("Add a professional summary of at least 50 characters");
  }
  const experience = cvData.experience;
  if (experience.length > 0) {
    const avgDescLength = experience.reduce((acc, exp) => acc + exp.description.length, 0) / experience.length;
    scores.experience = Math.min(100, experience.length * 30 + avgDescLength / 2);
  } else {
    suggestions.push("Add work experience or relevant projects");
  }
  const education = cvData.education;
  if (education.length > 0) {
    scores.education = Math.min(100, education.length * 50);
  } else {
    suggestions.push("Add your educational background");
  }
  const skills = cvData.skills;
  if (skills.length > 0) {
    scores.skills = Math.min(100, skills.length * 10);
  } else {
    suggestions.push("Add relevant skills to showcase your expertise");
  }
  const overall = Math.round(
    scores.personalInfo * 0.2 + scores.summary * 0.15 + scores.experience * 0.35 + scores.education * 0.15 + scores.skills * 0.15
  );
  return {
    overall,
    sections: scores,
    suggestions
  };
};
var sanitizeInput = (input) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<[^>]*>/g, "").trim();
};
var exportToJSON = (cvData) => {
  return JSON.stringify(cvData, null, 2);
};
var importFromJSON = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data && typeof data === "object" && data.personalInfo) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

// server.ts
var saveToLocalStorage = (key, data) => {
  console.warn("localStorage is not available in server environment");
};
var loadFromLocalStorage = (key) => {
  console.warn("localStorage is not available in server environment");
  return null;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
