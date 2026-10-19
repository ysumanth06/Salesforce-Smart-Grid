/**
 * @description Clean-room Matrix Transposer and Discrepancy Detection Engine.
 * Pivots tabular records into field rows and record columns for side-by-side inspection,
 * with discrepancy filtering and polymorphic cell mapping.
 */

/**
 * @description Compares a list of values across records to detect if they differ.
 * @param {Array<*>} values - Cell values for a single field across records
 * @returns {string} 'MATCH' | 'DIFFERING' | 'EMPTY'
 */
export function detectDiscrepancy(values) {
  if (!values || values.length === 0) {
    return "EMPTY";
  }

  const isAllEmpty = values.every(
    (v) => v === null || v === undefined || v === ""
  );
  if (isAllEmpty) {
    return "EMPTY";
  }

  const firstVal = values[0];
  const firstNormalized =
    firstVal !== null && firstVal !== undefined ? String(firstVal) : "";

  for (let i = 1; i < values.length; i++) {
    const curVal = values[i];
    const curNormalized =
      curVal !== null && curVal !== undefined ? String(curVal) : "";
    if (curNormalized !== firstNormalized) {
      return "DIFFERING";
    }
  }

  return "MATCH";
}

/**
 * @description Filters transposed rows based on active view mode.
 * @param {Array<Object>} rows - Transposed rows
 * @param {string} filterMode - 'ALL' | 'DIFFERENCES_ONLY' | 'POPULATED_ONLY'
 * @returns {Array<Object>} Filtered rows
 */
export function filterTransposedRows(rows, filterMode) {
  if (!rows || rows.length === 0) {
    return [];
  }
  if (!filterMode || filterMode === "ALL") {
    return rows;
  }
  if (filterMode === "DIFFERENCES_ONLY") {
    return rows.filter((r) => r.discrepancyStatus === "DIFFERING");
  }
  if (filterMode === "POPULATED_ONLY") {
    return rows.filter((r) => r.discrepancyStatus !== "EMPTY");
  }
  return rows;
}

/**
 * @description Transposes standard tabular records and columns into a field-oriented matrix.
 * @param {Object} options
 * @param {Array<Object>} options.records - Selected records to transpose
 * @param {Array<Object>} options.columns - Active grid column metadata
 * @param {string} [options.filterMode='ALL'] - View filter mode
 * @param {Array<Object>} [options.draftValues=[]] - Staged edits from dirty state manager
 * @param {number} [options.columnWidth=140] - Default width for record columns
 * @returns {Object} { columns, rows, differingCount, totalFieldCount }
 */
export function transposeGrid(options = {}) {
  const {
    records = [],
    columns = [],
    filterMode = "ALL",
    draftValues = [],
    columnWidth = 140
  } = options;

  if (!records || records.length === 0 || !columns || columns.length === 0) {
    return {
      columns: [],
      rows: [],
      differingCount: 0,
      totalFieldCount: 0
    };
  }

  // Build draft map for quick lookup: recordId -> { fieldName: value }
  const draftMap = new Map();
  if (draftValues && Array.isArray(draftValues)) {
    draftValues.forEach((draft) => {
      const id = draft.Id;
      if (id) {
        draftMap.set(id, draft);
      }
    });
  }

  // 1. Build Column Headers:
  // [Pinned Field Column] + [Record Column 1] + [Record Column 2] ... + [Status Column]
  const transposedColumns = [
    {
      fieldName: "__fieldLabel__",
      label: "Field Name",
      isPinned: true,
      type: "text",
      width: 200,
      headerClass: "transpose-th-pinned slds-text-title_caps"
    }
  ];

  records.forEach((record, index) => {
    const recordLabel =
      record.Name ||
      record.Subject ||
      record.CaseNumber ||
      `Record #${index + 1}`;
    transposedColumns.push({
      fieldName: record.Id,
      recordId: record.Id,
      label: recordLabel,
      isPinned: false,
      type: "dynamicCell",
      width: columnWidth,
      headerClass: "transpose-th-record slds-text-title_caps"
    });
  });

  transposedColumns.push({
    fieldName: "__status__",
    label: "Status",
    isPinned: false,
    type: "badge",
    width: 110,
    headerClass: "transpose-th-status slds-text-title_caps"
  });

  // 2. Build Field Rows:
  let differingCount = 0;
  const allRows = [];

  columns.forEach((col) => {
    const fieldApi = col.fieldName;
    if (!fieldApi) {
      return;
    }

    const cellValues = [];
    const recordCells = [];

    records.forEach((record) => {
      const recordId = record.Id;
      const rowDraft = draftMap.get(recordId) || {};
      const isDraft = rowDraft[fieldApi] !== undefined;
      const rawValue = isDraft ? rowDraft[fieldApi] : record[fieldApi];

      cellValues.push(rawValue);

      let displayValue = "";
      if (rawValue !== null && rawValue !== undefined) {
        displayValue = String(rawValue);
      }

      recordCells.push({
        key: `${recordId}_${fieldApi}`,
        recordId,
        fieldName: fieldApi,
        value: rawValue,
        displayValue,
        isDraft,
        isEditable: col.editable !== false,
        dataType: col.type || "text",
        colWidth: columnWidth
      });
    });

    const status = detectDiscrepancy(cellValues);
    if (status === "DIFFERING") {
      differingCount++;
    }

    let badgeClass = "slds-badge";
    let badgeLabel = "Match";
    if (status === "DIFFERING") {
      badgeClass = "slds-badge slds-theme_warning";
      badgeLabel = "Differing";
    } else if (status === "EMPTY") {
      badgeClass = "slds-badge slds-badge_lightest";
      badgeLabel = "Empty";
    }

    allRows.push({
      id: fieldApi,
      fieldApiName: fieldApi,
      fieldLabel: col.label || fieldApi,
      dataType: col.type || "text",
      isEditable: col.editable !== false,
      discrepancyStatus: status,
      badgeLabel,
      badgeClass,
      cells: recordCells
    });
  });

  const filteredRows = filterTransposedRows(allRows, filterMode);

  return {
    columns: transposedColumns,
    rows: filteredRows,
    differingCount,
    totalFieldCount: allRows.length
  };
}
