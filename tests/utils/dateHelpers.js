/**
 * dateHelpers.js
 * --------------
 * Shared date utility functions used across test files.
 *
 * All helpers return dates in dd/mm/yyyy format as required by the
 * Outlook Calendar date picker.
 */

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Formats a Date object as "dd/mm/yyyy".
 * @param {Date} date
 * @returns {string}
 */
export function formatDDMMYYYY(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/**
 * Returns a date N days from today formatted as "dd/mm/yyyy".
 * @param {number} daysAhead
 * @returns {string}
 */
export function futureDateDDMMYYYY(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatDDMMYYYY(d);
}

/**
 * Returns tomorrow's date as a Date object.
 * @returns {Date}
 */
export function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Returns a new Date with N months added (respects month-end edge cases).
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months, 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, maxDay));
  return d;
}
