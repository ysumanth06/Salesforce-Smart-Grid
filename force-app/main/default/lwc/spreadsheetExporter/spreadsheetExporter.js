/**
 * @description Exports grid data to a formatted Microsoft Excel (.xls) file using
 * standard Excel HTML format. Preserves header styling, conditional formatting colors,
 * formula results, and summary totals without third-party binary dependencies.
 */

export function sanitizeCellValue(rawVal) {
  if (rawVal === null || rawVal === undefined) {
    return "";
  }
  let str = String(rawVal);

  // Prevent formula injection (CWE-1236)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // HTML entity escaping
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildExcelHtml(
  data = [],
  columns = [],
  totalsData = [],
  title = "Smart Data Grid Export"
) {
  // Filter out columns that don't have a fieldName or are actions / URL helpers
  const visibleColumns = (columns || []).filter(
    (col) =>
      col.fieldName && col.type !== "action" && !col.fieldName.endsWith("_Url")
  );

  // Header row
  const headerHtml = visibleColumns
    .map(
      (col) =>
        `<th style="background-color: #0176d3; color: #ffffff; font-weight: bold; border: 1px solid #d8dde6; padding: 8px; text-align: left;">${sanitizeCellValue(
          col.label || col.fieldName
        )}</th>`
    )
    .join("");

  // Data rows
  const rowsHtml = (data || [])
    .map((row) => {
      const cells = visibleColumns
        .map((col) => {
          const rawVal = row[col.fieldName];
          const sanitized = sanitizeCellValue(rawVal);

          let cellStyle = "border: 1px solid #d8dde6; padding: 6px;";
          // Check for conditional formatting styles or classes
          if (row._cellStyles && row._cellStyles[col.fieldName]) {
            cellStyle += " " + row._cellStyles[col.fieldName];
          }

          return `<td style="${cellStyle}">${sanitized}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  // Totals row (TS-02 summary)
  let footerHtml = "";
  if (Array.isArray(totalsData) && totalsData.length > 0) {
    const totalsMap = {};
    totalsData.forEach((t) => {
      if (t.fieldApiName) {
        totalsMap[t.fieldApiName] = t;
      }
    });

    const footerCells = visibleColumns
      .map((col, idx) => {
        const agg = totalsMap[col.fieldName];
        let text = "";
        if (agg) {
          text = `Sum: ${agg.sum.toLocaleString()}`;
        } else if (idx === 0) {
          text = "Totals";
        }
        return `<td style="background-color: #f3f3f3; font-weight: bold; border-top: 2px solid #000000; border: 1px solid #d8dde6; padding: 6px;">${sanitizeCellValue(
          text
        )}</td>`;
      })
      .join("");
    footerHtml = `<tfoot><tr style="background-color: #f3f3f3;">${footerCells}</tr></tfoot>`;
  }

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>${sanitizeCellValue(title).slice(0, 30)}</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
</head>
<body>
  <table style="border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;">
    <thead>
      <tr>${headerHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    ${footerHtml}
  </table>
</body>
</html>`.trim();
}

/**
 * Triggers download of formatted Excel spreadsheet.
 */
export function exportToExcel(
  data,
  columns,
  totalsData = [],
  filename = "export.xls"
) {
  if (!data || !data.length || !columns || !columns.length) {
    return false;
  }

  const htmlContent = buildExcelHtml(data, columns, totalsData);

  // Use Data URI with UTF-8 BOM to bypass LWS Blob restrictions
  const encodedUri =
    "data:application/vnd.ms-excel;charset=utf-8,\uFEFF" +
    encodeURIComponent(htmlContent);

  if (typeof document !== "undefined") {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        filename.endsWith(".xls") ? filename : `${filename}.xls`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
  }

  return false;
}
