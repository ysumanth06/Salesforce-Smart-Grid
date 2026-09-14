/**
 * Column Header Menu Manager
 * Generates Excel-style in-place header action menus and executes real-time
 * filtering and column pinning for Salesforce lightning-datatable.
 */

const MAX_UNIQUE_VALUES = 15;
const BLANK_LABEL = "(Blank)";

/**
 * Generates the array of action items for a given column definition.
 *
 * @param {Object} col - Column definition object
 * @param {Array} data - Current table dataset
 * @param {Object} activeFilters - Map of fieldName -> Set of selected string values
 * @param {String} pinnedField - Currently pinned fieldApiName
 * @returns {Array} List of action objects for lightning-datatable
 */
export function generateColumnActions(
  col,
  data = [],
  activeFilters = {},
  pinnedField = null
) {
  const fieldApi = col.fieldName || col.fieldApiName;
  if (!fieldApi || fieldApi === "Id" || fieldApi.endsWith("_Url")) {
    return [];
  }

  const actions = [];
  const isPinned = pinnedField === fieldApi;

  // 1. Pin / Unpin Action
  actions.push({
    label: isPinned ? "Unpin from Left" : "Pin to Left",
    name: isPinned ? "unpin_left" : "pin_left",
    iconName: isPinned ? "utility:pinned" : "utility:pin"
  });

  // Extract distinct values and frequency
  const counts = new Map();
  for (const row of data) {
    const rawVal = row[fieldApi];
    const displayVal =
      rawVal === null || rawVal === undefined || rawVal === ""
        ? BLANK_LABEL
        : String(rawVal);
    counts.set(displayVal, (counts.get(displayVal) || 0) + 1);
  }

  // If no data rows, return basic actions
  if (counts.size === 0) {
    return actions;
  }

  const currentSelected = activeFilters[fieldApi];
  const isFiltered = currentSelected && currentSelected.size > 0;

  // 2. "All" (Show All / No Filter)
  actions.push({
    label: "All",
    name: "all",
    checked: !isFiltered
  });

  // Sort distinct values alphabetically, keeping (Blank) at the end
  let sortedKeys = Array.from(counts.keys()).sort((a, b) => {
    if (a === BLANK_LABEL) return 1;
    if (b === BLANK_LABEL) return -1;
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });

  const isHighCardinality = sortedKeys.length > MAX_UNIQUE_VALUES;
  if (isHighCardinality) {
    sortedKeys = sortedKeys.slice(0, MAX_UNIQUE_VALUES);
  }

  // 3. Distinct Value Checkboxes
  for (const val of sortedKeys) {
    const count = counts.get(val);
    const isChecked = isFiltered && currentSelected.has(val);
    actions.push({
      label: `${val} (${count})`,
      name: `val_${encodeURIComponent(val)}`,
      checked: Boolean(isChecked)
    });
  }

  // 4. High-cardinality indicator
  if (isHighCardinality) {
    actions.push({
      label: "More in Filter Builder...",
      name: "more_filters",
      iconName: "utility:filterList"
    });
  }

  // 5. Clear Filter Action
  if (isFiltered) {
    actions.push({
      label: "Clear Filter",
      name: "clear",
      iconName: "utility:clear"
    });
  }

  return actions;
}

/**
 * Filters rows based on all active column header filters.
 *
 * @param {Array} records - Records to filter
 * @param {Object} activeFilters - Map of fieldName -> Set of selected string values
 * @returns {Array} Filtered records
 */
export function filterRecordsByHeaderActions(records = [], activeFilters = {}) {
  if (!records || records.length === 0) {
    return [];
  }

  const activeEntries = Object.entries(activeFilters).filter(
    ([, set]) => set instanceof Set && set.size > 0
  );

  if (activeEntries.length === 0) {
    return [...records];
  }

  return records.filter((row) => {
    for (const [field, selectedSet] of activeEntries) {
      const rawVal = row[field];
      const strVal =
        rawVal === null || rawVal === undefined || rawVal === ""
          ? BLANK_LABEL
          : String(rawVal);
      if (!selectedSet.has(strVal)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Reorders columns so the pinned column is placed at index 0.
 *
 * @param {Array} columns - Original column array
 * @param {String} pinnedField - fieldName to pin
 * @returns {Array} Reordered column array with pinned icon
 */
export function reorderColumnsWithPin(columns = [], pinnedField = null) {
  if (!columns || columns.length === 0) {
    return [];
  }

  if (!pinnedField) {
    return columns.map((col) => {
      const copy = { ...col };
      if (copy.iconName === "utility:pinned") {
        delete copy.iconName;
      }
      return copy;
    });
  }

  const pinnedIndex = columns.findIndex(
    (col) => col.fieldName === pinnedField || col.fieldApiName === pinnedField
  );

  if (pinnedIndex === -1) {
    return [...columns];
  }

  const pinnedCol = { ...columns[pinnedIndex], iconName: "utility:pinned" };
  const otherCols = columns
    .filter((_, idx) => idx !== pinnedIndex)
    .map((col) => {
      const copy = { ...col };
      if (copy.iconName === "utility:pinned") {
        delete copy.iconName;
      }
      return copy;
    });

  return [pinnedCol, ...otherCols];
}
