"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, ArrowLeft, LogOut, Lock } from "lucide-react";
import MarksDialog from "./marks-dialog";
import { TeamDataType, MarksDBType } from "@/zod";
import { getExistingMark } from "@/actions/marks";
import { logoutAction } from "@/actions/logout";
import { useRouter } from "next/navigation";

interface SessionData {
  id: number;
  name: string;
  startedAt: Date | null;
  endedAt: Date | null;
}

interface SessionTeamsViewProps {
  juryName: string;
  juryId: number;
  session: SessionData;
  teams: TeamDataType[];
}

export function SessionTeamsView({
  juryName,
  juryId,
  session,
  teams,
}: SessionTeamsViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamDataType | null>(null);
  const [existingMark, setExistingMark] = useState<MarksDBType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoadingMark, setIsLoadingMark] = useState(false);
  const [teamMarks, setTeamMarks] = useState<Record<number, { marked: boolean; locked: boolean }>>({});

  // Filter teams by search term
  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;

    const term = searchTerm.toLowerCase();
    return teams.filter(
      (team) =>
        team.teamName.toLowerCase().includes(term) ||
        team.leaderId?.name?.toLowerCase().includes(term) ||
        team.members.some((m) => m.name.toLowerCase().includes(term))
    );
  }, [teams, searchTerm]);

  const handleTeamClick = async (team: TeamDataType) => {
    setSelectedTeam(team);
    setIsLoadingMark(true);
    setDialogOpen(true);

    try {
      const response = await getExistingMark({
        teamId: team.id!,
        juryId: juryId,
        sessionId: session.id,
      });
      const mark = response.success ? response.mark : null;
      setExistingMark(mark);
      
      // Update team marks state with marked and locked status
      if (mark) {
        setTeamMarks((prev) => ({ 
          ...prev, 
          [team.id!]: { marked: true, locked: mark.locked || false }
        }));
      }
    } catch (error) {
      console.error("Error fetching existing mark:", error);
      setExistingMark(null);
    } finally {
      setIsLoadingMark(false);
    }
  };

  const handleMarksSubmitted = (teamId: number) => {
    // Refresh the mark status after submission
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      handleTeamClick(team).then(() => {
        setDialogOpen(false);
      });
    }
  };

  const markedCount = teams.filter((t) => teamMarks[t.id!]?.marked).length;
  const lockedCount = teams.filter((t) => teamMarks[t.id!]?.locked).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/home")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sessions
              </Button>
              <div className="border-l pl-4">
                <h1 className="text-xl font-bold">{session.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {juryName}
                </p>
              </div>
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
        {/* Stats and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Teams</p>
                  <p className="text-3xl font-bold">{teams.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Marked</p>
                  <p className="text-3xl font-bold text-green-600">{markedCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Locked</p>
                  <p className="text-3xl font-bold text-blue-600">{lockedCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {teams.length - markedCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams by name, leader, or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "No teams match your search" : "No teams assigned"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "You don't have any teams assigned in this session yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => {
              const markStatus = teamMarks[team.id!];
              const isMarked = markStatus?.marked || false;
              const isLocked = markStatus?.locked || false;
              
              return (
                <Card
                  key={team.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-gray-400 hover:scale-[1.02]"
                  onClick={() => handleTeamClick(team)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{team.teamName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          HC_{team.id}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={isMarked ? "default" : "secondary"}>
                          {isMarked ? "Marked" : "Pending"}
                        </Badge>
                        {isLocked && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Leader:</span>
                        <span className="text-muted-foreground">
                          {team.leaderId?.name || "N/A"}
                        </span>
                      </div>
                      {team.members && team.members.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium">Members:</span>
                            <div className="text-muted-foreground text-xs mt-1">
                              {team.members.map((m) => m.name).join(", ")}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button className="w-full" size="sm" variant="outline">
                      {isLocked ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          View Locked Marks
                        </>
                      ) : isMarked ? (
                        "View/Edit Marks"
                      ) : (
                        "Add Marks"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Marks Dialog */}
      {selectedTeam && (
        <MarksDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          team={selectedTeam}
          juryId={juryId}
          sessionId={session.id}
          onMarksSubmitted={handleMarksSubmitted}
          existingMark={existingMark}
        />
      )}
    </div>
  );
}
