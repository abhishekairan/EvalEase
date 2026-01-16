import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { marksColumns } from "@/components/TableColumns";
import { getMarksWithData } from "@/db/utils/marksUtils";
import { Suspense } from "react";

// Loading component for the marks table
function MarksTableSkeleton() {
  return (
    <DataTable 
      columns={marksColumns} 
      data={[]} 
      isLoading={true} 
      pageSize={10}
    />
  );
}

// Main marks content component
async function MarksContent() {
  try {
    const data = await getMarksWithData();
    // console.log(rawData)
    
    return (
      <>
        <DataTable 
          columns={marksColumns} 
          data={data} 
          pageSize={15}
          enableExport={true}
          exportFilename={"Data"}
        />
      </>
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
        <Suspense fallback={
            <MarksTableSkeleton />
        }>
          <MarksContent />
        </Suspense>
      </div>
    </>
  );
};

export default MarksPage;
