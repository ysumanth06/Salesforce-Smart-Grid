export function exportToCSV(data, columns, filename = 'export.csv') {
    if (!data || !data.length || !columns || !columns.length) {
        return;
    }

    // Filter out columns that don't have a fieldName or are actions
    const visibleColumns = columns.filter(col => col.fieldName && col.type !== 'action');
    
    // Create CSV Header
    const csvHeader = visibleColumns.map(col => `"${col.label}"`).join(',');

    // Create CSV Body
    const csvBody = data.map(row => {
        return visibleColumns.map(col => {
            let cellValue = row[col.fieldName] === null || row[col.fieldName] === undefined ? '' : row[col.fieldName];
            // Escape quotes by doubling them
            cellValue = String(cellValue).replace(/"/g, '""');
            return `"${cellValue}"`;
        }).join(',');
    }).join('\n');

    const csvString = `${csvHeader}\n${csvBody}`;
    
    // Create a Data URI with UTF-8 BOM to bypass LWS Blob restrictions
    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csvString);
    const link = document.createElement('a');
    if (link.download !== undefined) {
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
