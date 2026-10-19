/**
 * @description External Clipboard Manager for Smart Grid.
 * Handles bidirectional Tab-Separated Values (TSV) copy/paste serialization with
 * Microsoft Excel, Google Sheets, and formula injection sanitization.
 */

import { neutralizeFormula, sanitizePastedValue } from "c/formulaShield";

/**
 * @description Serializes a 2D range of cells into Tab-Separated Values (TSV) for OS clipboard copy.
 * @param {Array<Object>} records - The full record list
 * @param {Array<Object>} columns - The active columns list
 * @param {Object} range - The active normalized range { minRow, maxRow, minCol, maxCol }
 * @returns {string} TSV text ready for clipboard.writeText()
 */
export function serializeRangeToTsv(records, columns, range) {
  if (!range || !records || !columns) {
    return "";
  }

  const lines = [];

  for (let r = range.minRow; r <= range.maxRow; r++) {
    const record = records[r];
    if (!record) {
      continue;
    }

    const rowCells = [];
    for (let c = range.minCol; c <= range.maxCol; c++) {
      const col = columns[c];
      if (!col) {
        rowCells.push("");
        continue;
      }

      const rawVal = record[col.fieldName];
      const sanitized = neutralizeFormula(
        rawVal !== null && rawVal !== undefined ? rawVal : ""
      );
      rowCells.push(sanitized);
    }

    lines.push(rowCells.join("\t"));
  }

  return lines.join("\r\n");
}

/**
 * @description Parses raw clipboard text (from Excel or Sheets) into a 2D matrix of strings.
 * @param {string} text - Raw clipboard text
 * @returns {Array<Array<string>>} 2D matrix of cleaned cell values
 */
export function parseTsvToMatrix(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  // Remove trailing line breaks
  const trimmed = text.replace(/[\r\n]+$/, "");
  if (!trimmed) {
    return [];
  }

  const rawRows = trimmed.split(/\r\n|\n|\r/);
  return rawRows.map((rowStr) => {
    const cells = rowStr.split("\t");
    return cells.map((cell) => sanitizePastedValue(cell.trim()));
  });
}

/**
 * @description Maps a 2D matrix of pasted values onto the grid records starting from an anchor cell.
 * @param {Array<Array<string>>} matrix - The parsed 2D clipboard matrix
 * @param {number} anchorRowIndex - Starting row index
 * @param {number} anchorColIndex - Starting column index
 * @param {Array<Object>} records - The full record list
 * @param {Array<Object>} columns - The active columns list
 * @returns {Array<Object>} List of { recordId, fieldName, value, oldValue } changes
 */
export function applyPastedMatrix(
  matrix,
  anchorRowIndex,
  anchorColIndex,
  records,
  columns
) {
  if (!matrix || matrix.length === 0 || !records || !columns) {
    return [];
  }

  const changes = [];

  for (let r = 0; r < matrix.length; r++) {
    const targetRowIdx = anchorRowIndex + r;
    if (targetRowIdx >= records.length) {
      break; // Reached end of records
    }

    const targetRecord = records[targetRowIdx];
    const rowValues = matrix[r];

    for (let c = 0; c < rowValues.length; c++) {
      const targetColIdx = anchorColIndex + c;
      if (targetColIdx >= columns.length) {
        break; // Reached end of columns
      }

      const col = columns[targetColIdx];
      if (!col || col.editable === false) {
        continue; // Skip non-editable columns
      }

      const fieldName = col.fieldName;
      const newValue = rowValues[c];
      const oldValue = targetRecord[fieldName];

      if (String(newValue) !== String(oldValue)) {
        changes.push({
          recordId: targetRecord.Id,
          fieldName,
          value: newValue,
          oldValue
        });
      }
    }
  }

  return changes;
}
