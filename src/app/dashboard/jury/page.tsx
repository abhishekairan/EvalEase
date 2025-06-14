import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { jurryColumns } from "@/components/TableColumns";
import { Button } from "@/components/ui/button";
import { getJury } from "@/db/utils";
import React, { Suspense } from "react";

function JurryTableSkeleton(){
  return (
    <DataTable columns={jurryColumns} data={[]} isLoading={true} pageSize={5}/>
  )
}


async function JuryContent(){
  try{
    const data = await getJury()
    return(
      <>
          <DataTable columns={jurryColumns} data={data} />
      </>
    )
  }catch(error){
    console.error("Error loading Juries: ",error)
  }
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-red-600">Error Loading Marks</h2>
        <p className="text-muted-foreground mt-2">
          There was an error loading the marks data. Please try again later.
        </p>
      </div>
    );

}
const page = async () => {
  try{

    const data = await getJury()
    return (
      <>
      <SiteHeader title="Jury" />
      <div className="container mx-auto py-10">
        <div className="space-y-4 space-x-4">
          <Button variant="secondary">Add Jury</Button>
          <Suspense fallback={
            <JurryTableSkeleton/>
          }>
            <JuryContent />
          </Suspense>
        </div>
      </div>
      </>
    );
  }catch(error){

  }
};

export default page;
