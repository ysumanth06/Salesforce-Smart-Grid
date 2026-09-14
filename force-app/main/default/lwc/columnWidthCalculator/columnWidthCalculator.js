/**
 * @description Utility for calculating optimal column widths for lightning-datatable
 * based on font-rendered character measurements and content length.
 */

export const MIN_WIDTH = 80;
export const MAX_WIDTH = 500;
export const CELL_PADDING = 36; // Accounting for cell padding, sort arrow, and header action button

let isCanvasSupported = true;
let canvasContext = null;

/**
 * Measures text width using an offscreen canvas.
 * Falls back to proportional character width estimation if canvas is unavailable.
 */
export function measureTextWidth(
  text,
  font = '13px "Salesforce Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
) {
  if (text === null || text === undefined || text === "") {
    return 0;
  }

  const str = String(text);

  if (isCanvasSupported && typeof document !== "undefined") {
    try {
      if (!canvasContext) {
        const canvas = document.createElement("canvas");
        canvasContext = canvas.getContext ? canvas.getContext("2d") : null;
        if (!canvasContext) {
          isCanvasSupported = false;
        }
      }
      if (canvasContext) {
        canvasContext.font = font;
        const metrics = canvasContext.measureText(str);
        if (metrics && typeof metrics.width === "number") {
          return metrics.width;
        }
      }
    } catch {
      isCanvasSupported = false;
    }
  }

  // Fallback: Proportional character width estimation
  let est = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 65 && code <= 90)
      est += 8.5; // Uppercase
    else if (code >= 97 && code <= 122)
      est += 7.2; // Lowercase
    else if (code >= 48 && code <= 57)
      est += 8.0; // Digits
    else if (code === 32)
      est += 4.0; // Space
    else est += 7.0;
  }
  return est;
}

/**
 * Calculates the optimal width for a single column.
 *
 * @param {Object} colDef - Column definition (must have label or fieldName)
 * @param {Array} rows - Array of record objects displayed on the current page
 * @param {Object} options - Optional overrides: { minWidth, maxWidth, padding }
 * @returns {Number} Optimal column width in pixels (clamped between minWidth and maxWidth)
 */
export function calculateColumnWidth(colDef, rows = [], options = {}) {
  const minWidth = options.minWidth || MIN_WIDTH;
  const maxWidth = options.maxWidth || MAX_WIDTH;
  const padding = options.padding || CELL_PADDING;

  if (!colDef) {
    return minWidth;
  }

  const fieldName = colDef.fieldName || colDef.fieldApiName || "";
  const headerLabel = colDef.label || fieldName;

  // Measure header text (bold font with extra headroom for icons)
  const headerWidth =
    measureTextWidth(
      headerLabel,
      'bold 13px "Salesforce Sans", -apple-system, BlinkMacSystemFont, sans-serif'
    ) +
    padding +
    20; // 20px extra for action dropdown arrow

  // Measure cell values in current rows
  let maxCellWidth = 0;
  if (Array.isArray(rows) && rows.length > 0 && fieldName) {
    for (let i = 0; i < rows.length; i++) {
      const cellVal = rows[i][fieldName];
      if (cellVal !== null && cellVal !== undefined && cellVal !== "") {
        const cellWidth = measureTextWidth(cellVal) + padding;
        if (cellWidth > maxCellWidth) {
          maxCellWidth = cellWidth;
        }
      }
    }
  }

  const neededWidth = Math.max(headerWidth, maxCellWidth);

  // Clamp within boundary limits
  return Math.min(maxWidth, Math.max(minWidth, Math.round(neededWidth)));
}

/**
 * Calculates optimal widths for all columns.
 *
 * @param {Array} columns - Array of column definitions
 * @param {Array} rows - Array of record objects
 * @param {Object} options - Optional overrides
 * @returns {Array} New column definitions array with updated initialWidth
 */
export function calculateAllColumnWidths(
  columns = [],
  rows = [],
  options = {}
) {
  if (!Array.isArray(columns)) return [];

  return columns.map((col) => ({
    ...col,
    initialWidth: calculateColumnWidth(col, rows, options)
  }));
}
