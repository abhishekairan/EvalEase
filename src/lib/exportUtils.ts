import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ColumnDef } from '@tanstack/react-table';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
}

export function exportTableToExcel<TData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: ExportOptions = {}
) {
  const { filename = 'export', sheetName = 'Sheet1' } = options;

  try {
    // Transform data based on column definitions
    const exportData = data.map(row => {
      const exportRow: Record<string, any> = {};
      
      columns.forEach((column,index) => {
        let value;
        let headerText: string;
        
        // Extract header text
        if (typeof column.header === 'string') {
          headerText = column.header;
        } else if (typeof column.header === 'function') {
          // For function headers, we'll use the column id or a fallback
          headerText = column.id || 'Column';
        } else {
          headerText = column.id || 'Column';
        }
        
        // Extract value based on column type
        if ('accessorFn' in column && column.accessorFn) {
          // Handle computed columns (like Total Score)
          value = column.accessorFn(row,index);
        } else if ('accessorKey' in column && column.accessorKey) {
          // Handle nested properties like "teamId.teamName"
          const keys = String(column.accessorKey).split('.');
          value = keys.reduce((obj, key) => obj?.[key], row as any);
        } else if (column.id) {
          // Fallback to id if available
          value = (row as any)[column.id];
        }
        
        // Clean up the value for Excel export
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        exportRow[headerText] = value ?? '';
      });
      
      return exportRow;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
}
