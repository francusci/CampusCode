export function httpError(status, message, code = 'REQUEST_ERROR', details) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (details) error.details = details;
  return error;
}

export function asString(value, field, { min = 1, max = 5000, optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) return null;
    throw httpError(400, `El campo ${field} es obligatorio.`, 'VALIDATION_ERROR');
  }
  if (typeof value !== 'string') {
    throw httpError(400, `El campo ${field} debe ser texto.`, 'VALIDATION_ERROR');
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw httpError(400, `El campo ${field} debe tener al menos ${min} caracteres.`, 'VALIDATION_ERROR');
  }
  if (trimmed.length > max) {
    throw httpError(400, `El campo ${field} supera el máximo de ${max} caracteres.`, 'VALIDATION_ERROR');
  }
  return trimmed;
}

export function asEmail(value) {
  const email = asString(value, 'correo', { min: 5, max: 160 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw httpError(400, 'Ingresa un correo electrónico válido.', 'VALIDATION_ERROR');
  }
  return email;
}

export function asPassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72) {
    throw httpError(400, 'La contraseña debe tener entre 8 y 72 caracteres.', 'VALIDATION_ERROR');
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw httpError(400, 'La contraseña debe combinar letras y números.', 'VALIDATION_ERROR');
  }
  return value;
}

export function asOneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw httpError(400, `El valor de ${field} no es válido.`, 'VALIDATION_ERROR');
  }
  return value;
}

export function asInt(value, field, { min = 0, max = 100000, optional = false } = {}) {
  if ((value === undefined || value === null || value === '') && optional) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw httpError(400, `El campo ${field} debe ser un entero entre ${min} y ${max}.`, 'VALIDATION_ERROR');
  }
  return number;
}

export function asDate(value, field, { optional = false } = {}) {
  if ((value === undefined || value === null || value === '') && optional) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw httpError(400, `El campo ${field} debe tener formato AAAA-MM-DD.`, 'VALIDATION_ERROR');
  }
  return value;
}

export function asStringArray(value, field, { maxItems = 12, maxLength = 40 } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw httpError(400, `El campo ${field} debe ser una lista.`, 'VALIDATION_ERROR');
  }
  if (value.length > maxItems) {
    throw httpError(400, `El campo ${field} admite máximo ${maxItems} elementos.`, 'VALIDATION_ERROR');
  }
  return value.map((item) => asString(item, field, { min: 1, max: maxLength }));
}

export function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.;]+$/, '');
}

export function parseNumber(value) {
  let text = String(value).trim().replace(/[^\d,.-]/g, '');
  if (!text) return null;
  if (text.includes(',') && text.includes('.')) {
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if (text.includes(',')) {
    const thousands = /^-?\d{1,3}(,\d{3})+$/.test(text);
    text = thousands ? text.replace(/,/g, '') : text.replace(',', '.');
  } else {
    text = text.replace(/(?<=\d)\.(?=\d{3}\b)/g, '');
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function answerMatches(input, correctAnswer, type) {
  const alternatives = String(correctAnswer).split('||').map((item) => item.trim()).filter(Boolean);
  if (type === 'codigo') {
    const cleanCode = (value) =>
      String(value)
        .toLowerCase()
        .replace(/#.*$/gm, '')
        .replace(/\s+/g, '')
        .replace(/[;]+$/g, '');
    const userCode = cleanCode(input);
    return alternatives.some((alternative) => cleanCode(alternative) === userCode);
  }
  const normalized = normalizeText(input);
  if (alternatives.some((alternative) => normalizeText(alternative) === normalized)) return true;
  const inputNumber = parseNumber(input);
  if (inputNumber !== null) {
    return alternatives.some((alternative) => {
      const expectedNumber = parseNumber(alternative);
      return expectedNumber !== null && Math.abs(expectedNumber - inputNumber) < 0.0001;
    });
  }
  return false;
}
