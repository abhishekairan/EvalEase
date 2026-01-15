"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, CheckCircle, Calendar, ArrowRight, LogOut, Lock } from "lucide-react";
import { logoutAction } from "@/actions/logout";
import { useRouter } from "next/navigation";

interface SessionData {
  id: number;
  name: string;
  startedAt: Date | null;
  endedAt: Date | null;
  status: "upcoming" | "started" | "past";
  teamCount: number;
}

interface JurySessionsViewProps {
  juryName: string;
  sessions: SessionData[];
}

export function JurySessionsView({
  juryName,
  sessions,
}: JurySessionsViewProps) {
  const router = useRouter();

  // Group sessions by status
  const groupedSessions = useMemo(() => {
    const started = sessions.filter((s) => s.status === "started");
    const upcoming = sessions.filter((s) => s.status === "upcoming");
    const past = sessions.filter((s) => s.status === "past");
    return { started, upcoming, past };
  }, [sessions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "started":
        return <Play className="h-5 w-5" />;
      case "upcoming":
        return <Clock className="h-5 w-5" />;
      case "past":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "started":
        return "bg-green-500";
      case "upcoming":
        return "bg-blue-500";
      case "past":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Not scheduled";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSessionClick = (session: SessionData) => {
    // Only allow access to started sessions
    if (session.status === "started") {
      router.push(`/home/session/${session.id}`);
    }
  };

  const renderSessionCard = (session: SessionData) => {
    const canAccess = session.status === "started";
    const isUpcoming = session.status === "upcoming";
    const isPast = session.status === "past";

    return (
      <Card
        key={session.id}
        className={`relative overflow-hidden transition-all duration-200 ${
          canAccess
            ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-green-500"
            : "opacity-75"
        }`}
        onClick={() => canAccess && handleSessionClick(session)}
      >
        {/* Status indicator stripe */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(
            session.status
          )}`}
        />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg ${getStatusColor(
                  session.status
                )} bg-opacity-10`}
              >
                {getStatusIcon(session.status)}
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  {session.name}
                </CardTitle>
                <Badge
                  variant={session.status === "started" ? "default" : "secondary"}
                  className="mt-2"
                >
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </Badge>
              </div>
            </div>

            {!canAccess && (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Session details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Started:</span>
              <span>{formatDate(session.startedAt)}</span>
            </div>
            
            {session.endedAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Ended:</span>
                <span>{formatDate(session.endedAt)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <div className="px-3 py-1.5 bg-purple-50 rounded-lg">
                <span className="text-sm font-semibold text-purple-700">
                  {session.teamCount} {session.teamCount === 1 ? "Team" : "Teams"} Assigned
                </span>
              </div>
            </div>
          </div>

          {/* Action area */}
          <div className="pt-3 border-t">
            {canAccess ? (
              <Button className="w-full gap-2" size="sm">
                View Teams & Start Marking
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : isUpcoming ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-2" />
                Session not started yet
              </div>
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Session has ended
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {juryName}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} assigned
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutAction()}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Sessions Assigned</h3>
              <p className="text-muted-foreground">
                You haven't been assigned to any sessions yet. Please contact the administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="started" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="started" className="gap-2">
                <Play className="h-4 w-4" />
                Ongoing ({groupedSessions.started.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="gap-2">
                <Clock className="h-4 w-4" />
                Upcoming ({groupedSessions.upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Past ({groupedSessions.past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="started" className="space-y-4">
              {groupedSessions.started.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No ongoing sessions</p>
                    <p className="text-sm text-muted-foreground">
                      You don't have any active sessions at the moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedSessions.started.map((session) =>
                    renderSessionCard(session)
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {groupedSessions.upcoming.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No upcoming sessions</p>
                    <p className="text-sm text-muted-foreground">
                      You don't have any scheduled sessions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedSessions.upcoming.map((session) =>
                    renderSessionCard(session)
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {groupedSessions.past.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No past sessions</p>
                    <p className="text-sm text-muted-foreground">
                      You don't have any completed sessions yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedSessions.past.map((session) =>
                    renderSessionCard(session)
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
