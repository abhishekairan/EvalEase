import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { teamColumns } from "@/components/TableColumns";
import { Button } from "@/components/ui/button";
import { getAllTeamsDetails } from "@/db/utils";
import React from "react";

const page = async () => {
  const rawData = await getAllTeamsDetails();
  // console.log("Raw Data",rawData)
  const data = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
  // console.log("data",data);
  return (
    <>
      <SiteHeader title="Teams" />
      <div className="container mx-auto py-10">
        <div className="space-y-4 space-x-4">
          <Button variant="secondary">Add Team</Button>
          <Button>Import From CSV</Button>
          <DataTable columns={teamColumns} data={data} />
        </div>
      </div>
    </>
  );
};

export default page;

/**
 * Type 'ColumnDef<{ 
 * id: number;
 * createdAt: Date | null; 
 * updatedAt: Date | null; 
 * teamName: string; 
 * leaderId: { 
 *  id: number; 
 *  name: string; 
 *  email: string; 
 *  phoneNumber: string; 
 *  role: "admin" | "jury" | "student"; 
 *  createdAt: Date | null; 
 *  updatedAt: Date | null; }; 
 *  members: { ...; }[]; 
 * }>[]' 
 * is not assignable to type 'ColumnDef<{ id: number; teamName: string; leaderId: { id: number; name: string; email: string; role: "admin" | "jury" | "student"; createdAt: Date | null; updatedAt: Date | null; }; createdAt: Date | null; updatedAt: Date | null; }, unknown>[]'.
 */