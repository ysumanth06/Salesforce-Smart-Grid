/**
 * Evaluates whether a given field value satisfies a format rule.
 * Supports string comparisons, numeric comparisons, and null checks.
 *
 * @param {Object} rule Format rule definition
 * @param {*} fieldValue Field value on the record
 * @returns {Boolean} True if rule matches, false otherwise
 */
export function evaluateRule(rule, fieldValue) {
  if (!rule || !rule.operator) {
    return false;
  }

  const op = (rule.operator || "").toUpperCase();
  const targetRaw =
    rule.value !== undefined && rule.value !== null
      ? String(rule.value).trim()
      : "";
  const actualRaw =
    fieldValue !== undefined && fieldValue !== null
      ? String(fieldValue).trim()
      : "";

  const targetLower = targetRaw.toLowerCase();
  const actualLower = actualRaw.toLowerCase();

  // Try numeric comparison if both are valid numbers
  const numTarget = Number(targetRaw);
  const numActual = Number(actualRaw);
  const isNumeric =
    !isNaN(numTarget) &&
    !isNaN(numActual) &&
    targetRaw !== "" &&
    actualRaw !== "";

  switch (op) {
    case "EQUALS":
    case "=":
      return isNumeric ? numActual === numTarget : actualLower === targetLower;

    case "NOT_EQUALS":
    case "!=":
    case "<>":
      return isNumeric ? numActual !== numTarget : actualLower !== targetLower;

    case "GREATER_THAN":
    case ">":
      return isNumeric ? numActual > numTarget : actualLower > targetLower;

    case "LESS_THAN":
    case "<":
      return isNumeric ? numActual < numTarget : actualLower < targetLower;

    case "GREATER_OR_EQUAL":
    case ">=":
      return isNumeric ? numActual >= numTarget : actualLower >= targetLower;

    case "LESS_OR_EQUAL":
    case "<=":
      return isNumeric ? numActual <= numTarget : actualLower <= targetLower;

    case "CONTAINS":
      return actualLower.includes(targetLower);

    case "STARTS_WITH":
      return actualLower.startsWith(targetLower);

    default:
      return false;
  }
}

/**
 * Applies format rules to an array of records and returns formatted records
 * with cell and row styling properties attached.
 *
 * Lower priority number wins if multiple rules match for the same field.
 *
 * @param {Array} records Array of record objects
 * @param {Array} rules Array of FormatRuleDTO objects
 * @param {Array} columns Array of grid column definitions
 * @returns {Array} Formatted records
 */
export function applyFormatRules(records, rules, columns = []) {
  if (!records || records.length === 0) {
    return records || [];
  }

  if (!rules || rules.length === 0) {
    return records;
  }

  // Sort rules by priority ascending (1 = highest priority)
  const sortedRules = [...rules].sort(
    (a, b) =>
      (a.priority != null ? a.priority : 100) -
      (b.priority != null ? b.priority : 100)
  );

  return records.map((record) => {
    const formatted = { ...record };
    let matchingRowRule = null;

    // Group rules by fieldApiName
    const rulesByField = {};
    sortedRules.forEach((rule) => {
      if (!rule.fieldApiName) return;
      if (!rulesByField[rule.fieldApiName]) {
        rulesByField[rule.fieldApiName] = [];
      }
      rulesByField[rule.fieldApiName].push(rule);
    });

    // Evaluate rules per field
    Object.keys(rulesByField).forEach((fieldName) => {
      const fieldRules = rulesByField[fieldName];
      const val = record[fieldName];

      for (const rule of fieldRules) {
        if (evaluateRule(rule, val)) {
          // First matching rule wins for this field
          if (rule.cellColor) {
            const cleanColor = String(rule.cellColor).replace(
              /[^a-zA-Z0-9]/g,
              ""
            );
            formatted[`${fieldName}_cellClass`] =
              `smart-grid-color-${cleanColor}`;
          }
          if (rule.iconName) {
            formatted[`${fieldName}_iconName`] = rule.iconName;
          }
          if (rule.rowHighlight && !matchingRowRule) {
            matchingRowRule = rule;
          }
          break;
        }
      }
    });

    // If any rule specifies rowHighlight, apply row highlight classes across columns
    if (matchingRowRule) {
      const cleanColor = String(matchingRowRule.cellColor || "green").replace(
        /[^a-zA-Z0-9]/g,
        ""
      );
      const rowClass = `smart-grid-row-highlight smart-grid-row-${cleanColor}`;
      formatted._rowClass = rowClass;

      // Apply row highlight class to each column's cell class if not already custom-colored
      columns.forEach((col) => {
        const colField = col.fieldName;
        if (colField && !formatted[`${colField}_cellClass`]) {
          formatted[`${colField}_cellClass`] = rowClass;
        }
      });
    }

    return formatted;
  });
}
