/**
 * @description 2D Rectangular Range Selection Manager for Smart Grid.
 * Tracks cell selection coordinates, boundary normalizations, keyboard navigation expansions,
 * and bulk range operations (Fill Down, Clear).
 */

/**
 * @description Creates and normalizes a 2D rectangular bounding box.
 * @param {number} startRow - Origin row index
 * @param {number} startCol - Origin column index
 * @param {number} endRow - Target/current row index
 * @param {number} endCol - Target/current column index
 * @returns {Object} Normalized range coordinates
 */
export function createRange(startRow, startCol, endRow, endCol) {
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  return {
    startRow,
    startCol,
    endRow,
    endCol,
    minRow,
    maxRow,
    minCol,
    maxCol,
    rowCount: maxRow - minRow + 1,
    colCount: maxCol - minCol + 1,
    totalCells: (maxRow - minRow + 1) * (maxCol - minCol + 1)
  };
}

/**
 * @description Tests if a given cell (rowIndex, colIndex) falls within the active range.
 * @param {number} rowIndex
 * @param {number} colIndex
 * @param {Object} range - Normalized range object
 * @returns {boolean}
 */
export function isCellInRange(rowIndex, colIndex, range) {
  if (!range) {
    return false;
  }
  return (
    rowIndex >= range.minRow &&
    rowIndex <= range.maxRow &&
    colIndex >= range.minCol &&
    colIndex <= range.maxCol
  );
}

/**
 * @description Tests if a given cell is the top-left origin anchor of the range.
 */
export function isRangeOrigin(rowIndex, colIndex, range) {
  if (!range) {
    return false;
  }
  return rowIndex === range.startRow && colIndex === range.startCol;
}

/**
 * @description Expands the active range in the given direction (for Shift + Arrow keys).
 * @param {Object} range - Current range
 * @param {string} direction - 'UP', 'DOWN', 'LEFT', 'RIGHT'
 * @param {number} totalRows - Maximum rows in dataset
 * @param {number} totalCols - Maximum columns in dataset
 * @returns {Object} Updated normalized range
 */
export function expandRange(range, direction, totalRows, totalCols) {
  if (!range) {
    return null;
  }

  let newEndRow = range.endRow;
  let newEndCol = range.endCol;

  switch (direction) {
    case "UP":
      newEndRow = Math.max(0, range.endRow - 1);
      break;
    case "DOWN":
      newEndRow = Math.min(totalRows - 1, range.endRow + 1);
      break;
    case "LEFT":
      newEndCol = Math.max(0, range.endCol - 1);
      break;
    case "RIGHT":
      newEndCol = Math.min(totalCols - 1, range.endCol + 1);
      break;
    default:
      break;
  }

  return createRange(range.startRow, range.startCol, newEndRow, newEndCol);
}

/**
 * @description Generates batch cell updates to fill values downwards from the top row of the range.
 * @param {Array<Object>} records - The full record list
 * @param {Array<Object>} columns - The active columns list
 * @param {Object} range - The active range
 * @returns {Array<Object>} List of { recordId, fieldName, value, oldValue } changes
 */
export function computeFillDown(records, columns, range) {
  if (!range || range.rowCount <= 1) {
    return [];
  }

  const changes = [];
  const sourceRecord = records[range.minRow];
  if (!sourceRecord) {
    return [];
  }

  for (let c = range.minCol; c <= range.maxCol; c++) {
    const col = columns[c];
    if (!col || col.editable === false) {
      continue;
    }

    const fieldName = col.fieldName;
    const fillValue = sourceRecord[fieldName];

    for (let r = range.minRow + 1; r <= range.maxRow; r++) {
      const targetRecord = records[r];
      if (targetRecord) {
        const oldValue = targetRecord[fieldName];
        if (oldValue !== fillValue) {
          changes.push({
            recordId: targetRecord.Id,
            fieldName,
            value: fillValue,
            oldValue
          });
        }
      }
    }
  }

  return changes;
}

/**
 * @description Generates batch cell updates to clear all editable cells in the range.
 * @param {Array<Object>} records - The full record list
 * @param {Array<Object>} columns - The active columns list
 * @param {Object} range - The active range
 * @returns {Array<Object>} List of { recordId, fieldName, value, oldValue } changes
 */
export function computeClearRange(records, columns, range) {
  if (!range) {
    return [];
  }

  const changes = [];

  for (let r = range.minRow; r <= range.maxRow; r++) {
    const record = records[r];
    if (!record) {
      continue;
    }

    for (let c = range.minCol; c <= range.maxCol; c++) {
      const col = columns[c];
      if (!col || col.editable === false) {
        continue;
      }

      const fieldName = col.fieldName;
      const oldValue = record[fieldName];
      if (oldValue !== null && oldValue !== undefined && oldValue !== "") {
        changes.push({
          recordId: record.Id,
          fieldName,
          value: "",
          oldValue
        });
      }
    }
  }

  return changes;
}
