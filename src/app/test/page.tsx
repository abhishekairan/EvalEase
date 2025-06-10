// page.tsx
"use client";

import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { DataTableToolbar } from "./data-table-toolbar";
import { 
  userColumns, 
  productColumns, 
  orderColumns, 
  reportColumns,
  UserData,
  ProductData,
  OrderData,
  ReportData
} from "./columns";
import { usersData, productsData, ordersData, reportsData } from "./data";

type TableDataType = UserData | ProductData | OrderData | ReportData;

export default function DynamicColumnTable() {
  const [activeView, setActiveView] = useState("users");

  const { currentData, currentColumns } = useMemo(() => {
    switch (activeView) {
      case "users":
        return { 
          currentData: usersData, 
          currentColumns: userColumns as ColumnDef<TableDataType>[]
        };
      case "products":
        return { 
          currentData: productsData, 
          currentColumns: productColumns as ColumnDef<TableDataType>[]
        };
      case "orders":
        return { 
          currentData: ordersData, 
          currentColumns: orderColumns as ColumnDef<TableDataType>[]
        };
      case "reports":
        return { 
          currentData: reportsData, 
          currentColumns: reportColumns as ColumnDef<TableDataType>[]
        };
      default:
        return { 
          currentData: usersData, 
          currentColumns: userColumns as ColumnDef<TableDataType>[]
        };
    }
  }, [activeView]);

  const table = useReactTable({
    data: currentData,
    columns: currentColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Dynamic Column Table
          </h2>
          <p className="text-muted-foreground">
            Each view has a different number of columns and data structure.
          </p>
        </div>
        
        <DataTableToolbar
          table={table}
          activeView={activeView}
          onViewChange={handleViewChange}
        />
        
        <div className="text-sm text-muted-foreground mb-2">
          Current view: <strong>{activeView}</strong> - 
          Columns: <strong>{currentColumns.length}</strong> - 
          Rows: <strong>{currentData.length}</strong>
        </div>
        
        <DataTable columns={currentColumns} data={currentData} />
      </div>
    </div>
  );
}
