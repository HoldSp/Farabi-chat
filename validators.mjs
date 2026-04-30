/**
 * Utility functions for validation and common operations
 */

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function validateKaznuEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized.endsWith("@live.kaznu.kz")) {
    return { valid: false, error: "Use a KazNU student email (@live.kaznu.kz)" };
  }
  return { valid: true };
}

export function validatePassword(password) {
  const pwd = String(password || "").trim();
  if (!pwd || pwd.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters long" };
  }
  return { valid: true };
}

export function validateName(name) {
  const n = String(name || "").trim();
  if (!n || n.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters long" };
  }
  return { valid: true };
}

export function validateNickname(nickname) {
  const value = String(nickname || "").trim();
  if (!value || value.length < 2) {
    return { valid: false, error: "Display name must be at least 2 characters long" };
  }
  return { valid: true };
}

export function validateCourse(course) {
  const c = Number(course);
  if (![1, 2, 3, 4].includes(c)) {
    return { valid: false, error: "Course must be between 1 and 4" };
  }
  return { valid: true };
}

export function validateRequiredField(value, fieldName) {
  if (!value || String(value).trim() === "") {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}
