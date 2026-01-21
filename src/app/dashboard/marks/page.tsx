import { SiteHeader } from "@/components/site-header";
import { LiveMarksTable } from "@/components/LiveMarksTable";
import { getMarksWithData } from "@/db/utils/marksUtils";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading component for the marks table
function MarksTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Skeleton for the live status bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      {/* Skeleton for the table */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

// Main marks content component with initial data
async function MarksContent() {
  try {
    // Fetch initial data on server for faster initial load
    const initialData = await getMarksWithData();
    
    return (
      <LiveMarksTable 
        initialData={initialData}
        pollingInterval={5000} // 5 seconds
      />
    );
  } catch (error) {
    console.error('Error loading marks:', error);
    
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-red-600">Error Loading Marks</h2>
        <p className="text-muted-foreground mt-2">
          There was an error loading the marks data. Please try again later.
        </p>
      </div>
    );
  }
}

const MarksPage = () => {
  return (
    <>
      <SiteHeader title="Marks" />
      <div className="container mx-auto py-10">
        <Suspense fallback={<MarksTableSkeleton />}>
          <MarksContent />
        </Suspense>
      </div>
    </>
  );
};

export default MarksPage;
