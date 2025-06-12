import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { participantsColumns } from "@/components/TableColumns";
import { Button } from "@/components/ui/button";
import { getTeamMemberData, getUsers } from "@/db/utils";
import React from "react";

const page = async () => {
  const data = await getTeamMemberData()
  return (
    <>
      <SiteHeader title="Participants" />
      <div className="container mx-auto py-10">
        <div className="space-y-4 space-x-4">
          <Button variant="secondary">Add Participant</Button>
          <Button>Import From CSV</Button>
          <DataTable columns={participantsColumns} data={data} />
        </div>
      </div>
    </>
  );
};

export default page;