import { DataTable } from "@/components/data-table";
import { AddTeamDialog } from "@/components/Dialogs/AddTeamDialog";
import { SiteHeader } from "@/components/site-header";
import { teamColumns } from "@/components/TableColumns";
import { Button } from "@/components/ui/button";
import { getAllTeamsDetails, getUsersForDropdown } from "@/db/utils";
import React from "react";

const page = async () => {
  const rawData = await getAllTeamsDetails();
  // console.log("Raw Data",rawData)
  const data = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
  // console.log("data",data);
  const teams = await getUsersForDropdown({type: 'student'});
  return (
    <>
      <SiteHeader title="Teams" />
      <div className="container mx-auto py-10">
        <div className="space-y-4 space-x-4">
          <AddTeamDialog students={teams}>
            <Button variant="secondary">Add Team</Button>
          </AddTeamDialog>
          <Button>Import From CSV</Button>
          <DataTable columns={teamColumns} data={data} />
        </div>
      </div>
    </>
  );
};

export default page;