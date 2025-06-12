import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { jurryColumns } from "@/components/TableColumns";
import { Button } from "@/components/ui/button";
import { getUsers } from "@/db/utils";
import React from "react";

const page = async () => {
  const data = await getUsers({type: 'jury'})
  return (
    <>
      <SiteHeader title="Jury" />
      <div className="container mx-auto py-10">
        <div className="space-y-4 space-x-4">
          <Button variant="secondary">Add Jury</Button>
          <DataTable columns={jurryColumns} data={data} />
        </div>
      </div>
    </>
  );
};

export default page;
