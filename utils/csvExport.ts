/**
 * CSV Export Utility
 * 
 * Provides functions for exporting data to CSV format with proper escaping
 * and formatting.
 */

/**
 * Escape CSV field value
 * Handles quotes, commas, and newlines
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If the value contains quotes, commas, or newlines, wrap it in quotes
  // and escape any existing quotes by doubling them
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert array of objects to CSV string
 * 
 * @param data - Array of data objects
 * @param columns - Array of column definitions with key and label
 * @returns CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T | string; label: string; render?: (value: any, row: T) => any }>
): string {
  if (data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map(col => escapeCSVField(col.label));
  const headerRow = headers.join(',');

  // Create data rows
  const dataRows = data.map(row => {
    const values = columns.map(col => {
      const value = row[col.key as keyof T];
      
      // If column has a render function, use it to format the value
      if (col.render) {
        const rendered = col.render(value, row);
        // Extract text content if rendered is a React element
        if (typeof rendered === 'object' && rendered !== null) {
          return escapeCSVField('');
        }
        return escapeCSVField(rendered);
      }
      
      return escapeCSVField(value);
    });
    
    return values.join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 * 
 * @param csvContent - CSV string content
 * @param filename - Name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV filename with timestamp
 * 
 * @param entityType - Type of entity being exported (e.g., 'guests', 'events')
 * @returns Filename in format: {entity-type}-{timestamp}.csv
 */
export function generateCSVFilename(entityType: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${entityType}-${timestamp}.csv`;
}

/**
 * Export data to CSV and trigger download
 * 
 * @param data - Array of data objects
 * @param columns - Array of column definitions
 * @param entityType - Type of entity being exported
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T | string; label: string; render?: (value: any, row: T) => any }>,
  entityType: string
): void {
  const csvContent = convertToCSV(data, columns);
  const filename = generateCSVFilename(entityType);
  downloadCSV(csvContent, filename);
}
