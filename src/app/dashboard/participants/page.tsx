import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { participantsColumns } from "@/components/TableColumns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddParticipantDialog } from "@/components/Dialogs/AddParticipantDialog";
import { getParticipants, getTeamsForDropdown } from "@/db/utils";
import { Suspense } from "react";

// Enhanced skeleton loading component
function ParticipantsPageSkeleton() {
  return (
    <div className="space-y-6">
      
      {/* Buttons skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      
      {/* Table skeleton */}
      <DataTable 
        columns={participantsColumns} 
        data={[]} 
        isLoading={true} 
        pageSize={10}
      />
    </div>
  );
}

// Main participants content component
async function ParticipantsContent() {
  try {
    const data = await getParticipants();
    const teams = await getTeamsForDropdown();
    // console.log("Total participants: ",data.length)
    return (
      <>
        <div className="flex flex-wrap gap-4 mb-6">
          <AddParticipantDialog teams={teams}>
            <Button variant="secondary">Add Participant</Button>
          </AddParticipantDialog>
          
          {/* <Button variant="outline">Import From CSV</Button> */}
        </div>
        
        <DataTable 
          columns={participantsColumns} 
          data={data} 
          pageSize={15}
        />
      </>
    );
  } catch (error) {
    console.error('Error loading participants:', error);
    
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-red-600">Error Loading Participants</h2>
        <p className="text-muted-foreground mt-2">
          There was an error loading the participants data. Please try again later.
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }
}



const ParticipantsPage = () => {
  return (
    <>
      <SiteHeader title="Participants" />
      <div className="container mx-auto py-10">
        <Suspense fallback={<ParticipantsPageSkeleton />}>
          <ParticipantsContent />
        </Suspense>
      </div>
    </>
  );
};

export default ParticipantsPage;
