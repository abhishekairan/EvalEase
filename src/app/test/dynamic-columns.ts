// dynamic-columns.ts
import { ColumnDef } from "@tanstack/react-table";

export function generateDynamicColumns<T extends Record<string, any>>(
  data: T[],
  excludeKeys: string[] = []
): ColumnDef<T>[] {
  if (data.length === 0) return [];
  
  const keys = Object.keys(data[0]).filter(key => !excludeKeys.includes(key));
  
  return keys.map(key => ({
    accessorKey: key,
    header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    cell: ({ row }) => {
      const value = row.getValue(key);
      if (typeof value === 'number' && key.includes('price')) {
        return `$${value.toFixed(2)}`;
      }
      return String(value || '');
    },
  }));
}
