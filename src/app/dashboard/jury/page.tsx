import { AddJuryDialog } from "@/components/Dialogs/AddJuryDialog";
import { SiteHeader } from "@/components/site-header";
import { JuryDataTable } from "@/components/JuryDataTable";
import { Button } from "@/components/ui/button";
import { getJuryWithSessions, getSessionsForDropdown } from "@/db/utils";
import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function JurryTableSkeleton(){
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}


async function JuryContent(){
  try{
    const data = await getJuryWithSessions()
    const sessions = await getSessionsForDropdown()
    
    return(
      <>
        <AddJuryDialog sessions={sessions}>
          <Button variant={"secondary"}>Add Jury</Button>
        </AddJuryDialog>
        <JuryDataTable data={data} sessions={sessions} />
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

    return (
      <>
      <SiteHeader title="Jury" />
      <div className="container mx-auto py-10">
        <div className="space-y-4 space-x-4">
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
    console.log(error)
  }
};

export default page;
