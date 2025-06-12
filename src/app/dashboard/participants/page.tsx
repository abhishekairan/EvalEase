// app/page.tsx
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { participantsColumns } from "@/components/TableColumns";
import { Button } from "@/components/ui/button";
import { AddParticipantDialog } from "@/components/Dialogs/AddParticipantDialog";
import { getUsersWithTeamInfo } from "@/db/utils";
import { getTeamsForDropdown } from "@/db/utils/teamUtils";
import React from "react";

const page = async () => {
  const data = await getUsersWithTeamInfo();
  const teams = await getTeamsForDropdown();

  return (
    <>
      <SiteHeader title="Participants" />
      <div className="container mx-auto py-6">
        <div className="space-y-4 space-x-4">
          <AddParticipantDialog teams={teams}>
            <Button variant="secondary">Add Participant</Button>
          </AddParticipantDialog>
          <DataTable columns={participantsColumns} data={data} />
        </div>
      </div>
    </>
  );
};

export default page;
