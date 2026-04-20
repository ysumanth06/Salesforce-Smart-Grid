/**
 * Shared error utility for Smart Grid LWC components.
 * Extracts meaningful error messages from Apex and platform errors.
 * @param {Object} error - Error object from Apex or LWC platform
 * @returns {String} Human-readable error message
 */
export function reduceErrors(error) {
  // AuraHandledException / wire error
  if (error && error.body && error.body.message) {
    return error.body.message;
  }
  // Array of errors (e.g. from wire adapter)
  if (Array.isArray(error) && error.length > 0) {
    return error.map((e) => e.message || String(e)).join(", ");
  }
  // Standard JS error
  if (error && error.message) {
    return error.message;
  }
  return error ? String(error) : "Unknown error";
}
