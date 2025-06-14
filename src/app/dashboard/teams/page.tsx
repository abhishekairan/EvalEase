import { DataTable } from "@/components/data-table";
import { AddTeamDialog } from "@/components/Dialogs/AddTeamDialog";
import { SiteHeader } from "@/components/site-header";
import { teamColumns } from "@/components/TableColumns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getParticipantsForDropdown, getTeamsWithData } from "@/db/utils";
import { Suspense } from "react";

// Loading component for the teams table
function TeamsTableSkeleton() {
  return (
    <DataTable 
      columns={teamColumns} 
      data={[]} 
      isLoading={true} 
      pageSize={10}
    />
  );
}

// Enhanced skeleton loading component for the entire page
function TeamsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Buttons skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Table skeleton */}
      <TeamsTableSkeleton />
    </div>
  );
}

// Main teams content component
async function TeamsContent() {
  try {
    const data = await getTeamsWithData();
    const teams = await getParticipantsForDropdown();
    
    return (
      <>
        <div className="flex flex-wrap gap-4 mb-6">
          <AddTeamDialog students={teams}>
            <Button variant="secondary">Add Team</Button>
          </AddTeamDialog>
          
          <Button variant="outline">Import From CSV</Button>
        </div>
        
        <DataTable 
          columns={teamColumns} 
          data={data} 
          pageSize={15}
        />
      </>
    );
  } catch (error) {
    console.error('Error loading teams:', error);
    
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-red-600">Error Loading Teams</h2>
        <p className="text-muted-foreground mt-2">
          There was an error loading the teams data. Please try again later.
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

const TeamsPage = () => {
  return (
    <>
      <SiteHeader title="Teams" />
      <div className="container mx-auto py-10">
        <Suspense fallback={<TeamsPageSkeleton />}>
          <TeamsContent />
        </Suspense>
      </div>
    </>
  );
};

export default TeamsPage;
