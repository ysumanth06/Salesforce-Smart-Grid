/**
 * @description Formula Injection Shield for Smart Grid spreadsheet clipboard and export.
 * Neutralizes malicious spreadsheet formula injection (=, +, -, @) upon copy/export
 * and cleanly de-sanitizes safety apostrophes upon paste/import.
 */

const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * @description Prepend an apostrophe if the value begins with a formula execution character.
 * @param {*} value - The cell value to sanitize
 * @returns {string} Sanitized string safe for Excel and Google Sheets
 */
export function neutralizeFormula(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.length === 0) {
    return "";
  }

  const firstChar = str.charAt(0);
  if (FORMULA_TRIGGER_CHARS.includes(firstChar)) {
    return `'${str}`;
  }
  return str;
}

/**
 * @description Strips the leading safety apostrophe if it was prepended to protect a formula operator.
 * @param {*} value - The pasted text value
 * @returns {string} De-sanitized value ready for Salesforce storage
 */
export function sanitizePastedValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.length >= 2 && str.charAt(0) === "'") {
    const secondChar = str.charAt(1);
    if (FORMULA_TRIGGER_CHARS.includes(secondChar)) {
      return str.substring(1);
    }
  }
  return str;
}
