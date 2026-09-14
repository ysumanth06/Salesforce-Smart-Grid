/**
 * Safe, sandboxed arithmetic formula evaluator for computed columns.
 * Supports basic arithmetic (+, -, *, /), parentheses, numbers, and record field references.
 * Never uses eval() or new Function().
 */

/**
 * Tokenizes a formula string into tokens: operators, parentheses, numbers, and identifiers.
 */
function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (
      ch === "+" ||
      ch === "-" ||
      ch === "*" ||
      ch === "/" ||
      ch === "(" ||
      ch === ")"
    ) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }

    // Numbers
    if (/\d/.test(ch) || (ch === "." && /\d/.test(expr[i + 1]))) {
      let numStr = "";
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: "number", value: parseFloat(numStr) });
      continue;
    }

    // Identifiers (field API names)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      tokens.push({ type: "ident", value: ident });
      continue;
    }

    // Unknown character -> error
    return null;
  }
  return tokens;
}

/**
 * Evaluates tokens using standard operator precedence (Shunting-yard / RPN evaluation).
 */
function evaluateTokens(tokens, record) {
  if (!tokens || tokens.length === 0) return null;

  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const outputQueue = [];
  const operatorStack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "number") {
      outputQueue.push(token.value);
    } else if (token.type === "ident") {
      const fieldVal = record[token.value];
      if (fieldVal === undefined || fieldVal === null || fieldVal === "") {
        return null; // Missing or blank field reference
      }
      const numVal = Number(fieldVal);
      if (isNaN(numVal)) {
        return null; // Non-numeric field
      }
      outputQueue.push(numVal);
    } else if (token.type === "op") {
      const op = token.value;
      if (op === "(") {
        operatorStack.push(op);
      } else if (op === ")") {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== "("
        ) {
          outputQueue.push(operatorStack.pop());
        }
        if (operatorStack.length === 0) return null; // Mismatched parentheses
        operatorStack.pop(); // Pop '('
      } else {
        // Handle unary minus: if '-' is first token or preceded by an operator or '('
        const prevToken = i > 0 ? tokens[i - 1] : null;
        if (
          op === "-" &&
          (!prevToken || (prevToken.type === "op" && prevToken.value !== ")"))
        ) {
          // Unary minus: treat as (0 - next)
          outputQueue.push(0);
        }

        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== "(" &&
          precedence[operatorStack[operatorStack.length - 1]] >= precedence[op]
        ) {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.push(op);
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (op === "(" || op === ")") return null; // Mismatched parentheses
    outputQueue.push(op);
  }

  // Evaluate RPN
  const evalStack = [];
  for (const item of outputQueue) {
    if (typeof item === "number") {
      evalStack.push(item);
    } else {
      if (evalStack.length < 2) return null;
      const b = evalStack.pop();
      const a = evalStack.pop();

      switch (item) {
        case "+":
          evalStack.push(a + b);
          break;
        case "-":
          evalStack.push(a - b);
          break;
        case "*":
          evalStack.push(a * b);
          break;
        case "/":
          if (b === 0) return null; // Division by zero -> return null
          evalStack.push(a / b);
          break;
        default:
          return null;
      }
    }
  }

  if (evalStack.length !== 1) return null;
  const result = evalStack[0];
  return isFinite(result) ? result : null;
}

/**
 * Evaluates a formula expression against a given record safely.
 * Returns formatted result or '—' on error/missing field/division by zero.
 *
 * @param {String} expression - Arithmetic expression (e.g. "Amount * Probability / 100")
 * @param {Object} record - SObject record map
 * @returns {Number|String} Evaluated number or '—'
 */
export function evaluateFormula(expression, record) {
  if (!expression || !record) return "—";

  try {
    const tokens = tokenize(expression);
    if (!tokens) return "—";

    const result = evaluateTokens(tokens, record);
    if (result === null || result === undefined || isNaN(result)) {
      return "—";
    }

    // Round to 2 decimal places if fractional
    return Math.round(result * 100) / 100;
  } catch {
    return "—";
  }
}

/**
 * Recalculates all computed formula columns for a dataset, taking into account
 * any pending inline drafts.
 *
 * @param {Array} records - Grid data array
 * @param {Array} columns - Grid column definitions
 * @param {Array} draftValues - Pending inline edits
 * @returns {Array} Updated records with recalculated formula fields
 */
export function computeFormulaColumns(records, columns, draftValues = []) {
  if (!records || records.length === 0 || !columns || columns.length === 0) {
    return records || [];
  }

  // Find computed columns
  const formulaCols = columns.filter((col) => col.formula || col.expression);
  if (formulaCols.length === 0) {
    return records;
  }

  const draftMap = {};
  draftValues.forEach((d) => {
    if (d.Id) {
      draftMap[d.Id] = d;
    }
  });

  return records.map((record) => {
    const draft = draftMap[record.Id] || {};
    const effectiveRecord = { ...record, ...draft };
    const updated = { ...record };

    formulaCols.forEach((col) => {
      const expr = col.formula || col.expression;
      updated[col.fieldName] = evaluateFormula(expr, effectiveRecord);
    });

    return updated;
  });
}
