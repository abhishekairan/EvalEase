// data-table-toolbar.tsx
"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  activeView,
  onViewChange,
}: DataTableToolbarProps<TData>) {
  const toolbarButtons = [
    { id: "users", label: "Users", icon: "👥" },
    { id: "products", label: "Products", icon: "📦" },
    { id: "orders", label: "Orders", icon: "🛒" },
    { id: "reports", label: "Reports", icon: "📊" },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="flex space-x-2">
          {toolbarButtons.map((button) => (
            <Button
              key={button.id}
              variant={activeView === button.id ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange(button.id)}
              className="h-8"
            >
              <span className="mr-2">{button.icon}</span>
              {button.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} row(s) total.
        </p>
      </div>
    </div>
  );
}
