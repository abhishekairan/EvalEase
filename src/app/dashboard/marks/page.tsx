import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { marksColumns } from "@/components/TableColumns";
import { getMarksData } from "@/db/utils";
import React from "react";

const page = async () => {
  const data = await getMarksData()
  return (
    <>
      <SiteHeader title="Marks" />
      <div className="container mx-auto py-10">
        <div className="space-y-4 space-x-4">
          <DataTable columns={marksColumns} data={data} />
        </div>
      </div>
    </>
  );
};

export default page;
