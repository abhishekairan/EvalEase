import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import DynamicColumnTable from "@/components/dynamicColumnTables"



export default function Page() {
  return (
    <>
    <SiteHeader title="Dashboard"/>
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <DynamicColumnTable />
          {/* <DataTable data={data} /> */}
        </div>
      </div>
    </div>
    </>
  )
}