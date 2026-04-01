// pages/utils/textHelpers.js
// Shared text/regex utilities used across POM components.

/**
 * Escapes all RegExp special characters in a string so it can be used
 * as a literal pattern inside `new RegExp(...)`.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
