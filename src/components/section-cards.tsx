import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card flex flex-col gap-8 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:flex-row @xl/main:gap-6 @5xl/main:gap-8">
      <Card 
        className="@container/card hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/5 via-background to-card border border-border/50 backdrop-blur-sm flex-1"
        data-slot="card"
      >
        <CardHeader className="space-y-3">
          <CardDescription className="text-sm font-medium text-muted-foreground">
            Total Teams
          </CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            150
          </CardTitle>
        </CardHeader>
      </Card>

      <Card 
        className="@container/card hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/5 via-background to-card border border-border/50 backdrop-blur-sm flex-1"
        data-slot="card"
      >
        <CardHeader className="space-y-3">
          <CardDescription className="text-sm font-medium text-muted-foreground">
            Total Jurys
          </CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            8
          </CardTitle>
        </CardHeader>
      </Card>

      <Card 
        className="@container/card hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/5 via-background to-card border border-border/50 backdrop-blur-sm flex-1"
        data-slot="card"
      >
        <CardHeader className="space-y-3">
          <CardDescription className="text-sm font-medium text-muted-foreground">
            Total Participants
          </CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            600
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
