/**
 * Utility functions for validation and common operations
 */

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function validateKaznuEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized.endsWith("@live.kaznu.kz")) {
    return { valid: false, error: "Используй студенческую почту КазНУ (@live.kaznu.kz)" };
  }
  return { valid: true };
}

export function validatePassword(password) {
  const pwd = String(password || "").trim();
  if (!pwd || pwd.length < 6) {
    return { valid: false, error: "Пароль должен быть минимум 6 символов" };
  }
  return { valid: true };
}

export function validateName(name) {
  const n = String(name || "").trim();
  if (!n || n.length < 2) {
    return { valid: false, error: "Имя должно быть минимум 2 символа" };
  }
  return { valid: true };
}

export function validateNickname(nickname) {
  const value = String(nickname || "").trim();
  if (!value || value.length < 2) {
    return { valid: false, error: "Nickname должен быть минимум 2 символа" };
  }
  return { valid: true };
}

export function validateCourse(course) {
  const c = Number(course);
  if (![1, 2, 3, 4].includes(c)) {
    return { valid: false, error: "Курс должен быть от 1 до 4" };
  }
  return { valid: true };
}

export function validateRequiredField(value, fieldName) {
  if (!value || String(value).trim() === "") {
    return { valid: false, error: `${fieldName} обязательно` };
  }
  return { valid: true };
}
