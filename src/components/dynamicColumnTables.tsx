// page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useReactTable, getCoreRowModel, ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { DataTableToolbar } from "@/components/data-table-toolbar";
import { MarksDataType, TeamDataType, TeamMemberDataType, UserDBType, userWithTeamType } from "@/zod";
import { jurryColumns, marksColumns, participantsColumns, teamColumns } from "./TableColumns";


type TableDataType = MarksDataType | UserDBType | TeamDataType | TeamMemberDataType | userWithTeamType

export default function DynamicColumnTable() {
  const [activeView, setActiveView] = useState("participants");
  const [currentData, setCurrentData] = useState<TableDataType[]>([])

  useEffect(() => {
    
  }, [activeView])

  const currentColumns = useMemo(() => {
    switch (activeView) {
      case "particiapants":
        return participantsColumns as ColumnDef<TableDataType>[]
      case "jury":
        return jurryColumns as ColumnDef<TableDataType>[]
      case "teams":
        return teamColumns as ColumnDef<TableDataType>[]
      case "marks":
        return marksColumns as ColumnDef<TableDataType>[]
      default:
        return participantsColumns as ColumnDef<TableDataType>[]
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
        
        <DataTableToolbar
          table={table}
          activeView={activeView}
          onViewChange={handleViewChange}
        />
        {/*
        <div className="text-sm text-muted-foreground mb-2">
          Current view: <strong>{activeView}</strong> - 
          Columns: <strong>{currentColumns.length}</strong> - 
          Rows: <strong>{currentData.length}</strong>
        </div> */}
        
        <DataTable columns={currentColumns} data={currentData} />
      </div>
    </div>
  );
}
