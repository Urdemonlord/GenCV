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

export {
  generateId,
  formatDate,
  validateEmail,
  validatePhone,
  calculateCVScore,
  sanitizeInput,
  exportToJSON,
  importFromJSON
};
