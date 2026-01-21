"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Users, ArrowLeft, LogOut, Lock, CheckCircle2, Clock, AlertCircle, LucideIcon, AlertTriangle, Send } from "lucide-react";
import MarksDialog from "./marks-dialog";
import { TeamDataType, MarksDBType } from "@/zod";
import { getExistingMark, lockAllMarksForJuryInSession } from "@/actions/marks";
import { useLogout } from "@/hooks/use-logout";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

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
  initialMarksStatus: Record<number, { marked: boolean; locked: boolean }>;
}

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  theme: 'gray' | 'green' | 'blue' | 'orange';
}

function StatsCard({ icon: Icon, label, value, theme }: StatsCardProps) {
  const themeStyles = {
    gray: {
      bg: 'bg-slate-50',
      border: 'border-gray-200',
      icon: 'text-gray-400',
      label: 'text-muted-foreground',
      value: 'text-gray-900'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-400',
      label: 'text-green-700',
      value: 'text-green-700'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-400',
      label: 'text-blue-700',
      value: 'text-blue-700'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-400',
      label: 'text-orange-700',
      value: 'text-orange-700'
    }
  };

  const styles = themeStyles[theme];

  return (
    <div className={`relative flex items-center gap-2 ${styles.bg} rounded-lg border ${styles.border} shadow-sm px-3 py-2 flex-1`}>
      <Icon className={`absolute inset-0 h-7 w-7 ${styles.icon} opacity-30 m-auto`} />
      <div className="text-center relative z-10 w-full">
        <div className={`text-xs ${styles.label} font-medium`}>{label}</div>
        <div className={`text-lg font-bold ${styles.value}`}>{value}</div>
      </div>
    </div>
  );
}

export function SessionTeamsView({
  juryName,
  juryId,
  session,
  teams,
  initialMarksStatus,
}: SessionTeamsViewProps) {
  const router = useRouter();
  const { handleLogout } = useLogout();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamDataType | null>(null);
  const [existingMark, setExistingMark] = useState<MarksDBType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoadingMark, setIsLoadingMark] = useState(false);
  const [loadingTeamId, setLoadingTeamId] = useState<number | null>(null);
  const [teamMarks, setTeamMarks] =
    useState<Record<number, { marked: boolean; locked: boolean }>>(
      initialMarksStatus
    );
  const [isLockingAll, setIsLockingAll] = useState(false);
  const [lockAllDialogOpen, setLockAllDialogOpen] = useState(false);

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
    setLoadingTeamId(team.id!);

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
          [team.id!]: { marked: true, locked: mark.locked || false },
        }));
      }
      
      // Open dialog only after data is fetched
      setDialogOpen(true);
    } catch (error) {
      console.error("Error fetching existing mark:", error);
      setExistingMark(null);
      // Still open dialog even if fetch fails
      setDialogOpen(true);
    } finally {
      setIsLoadingMark(false);
      setLoadingTeamId(null);
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
  const pendingLockCount = markedCount - lockedCount;

  const handleLockAllMarks = async () => {
    setIsLockingAll(true);
    try {
      const result = await lockAllMarksForJuryInSession({
        juryId,
        sessionId: session.id,
        teamIds: teams.map(t => t.id!),
      });

      if (result.success) {
        toast.success("All marks submitted", {
          description: result.message,
        });
        // Update local state to reflect ALL teams as locked
        setTeamMarks(() => {
          const updated: Record<number, { marked: boolean; locked: boolean }> = {};
          for (const team of teams) {
            updated[team.id!] = { marked: true, locked: true };
          }
          return updated;
        });
      } else {
        toast.error("Failed to lock marks", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error locking all marks:", error);
      toast.error("Failed to lock marks", {
        description: "Please try again or contact support",
      });
    } finally {
      setIsLockingAll(false);
      setLockAllDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <header
        className="bg-white border-b shadow-sm sticky top-0 z-10"
        role="banner"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Left Section - Back Button & Session Info */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/home")}
                className="gap-1.5 shrink-0 h-8 sm:h-9 px-2 sm:px-3"
                aria-label="Go back to sessions list"
              >
                <ArrowLeft
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline text-sm">Back</span>
              </Button>

              <div className="border-l h-8 sm:h-10" />

              <div className="min-w-0 flex-1">
                <h1
                  className="text-base sm:text-lg md:text-xl font-bold truncate"
                  title={session.name}
                >
                  {session.name}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                  Welcome, <span className="font-medium">{juryName}</span>
                </p>
              </div>

              {/* Right Section - Logout Button */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 shrink-0 h-9 sm:h-10"
              size="sm"
              aria-label="Logout from application"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Stats/Search/Submit Bar */}
      <div className="sticky top-14 z-9 bg-gray-50 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
            {/* Stats Overview */}
            <div className="flex gap-3 sm:gap-4 w-full justify-center sm:w-auto overflow-x-auto">
              <StatsCard
                icon={Users}
                label="Total"
                value={teams.length}
                theme="gray"
              />
              <StatsCard
                icon={CheckCircle2}
                label="Marked"
                value={markedCount}
                theme="green"
              />
              <StatsCard
                icon={Lock}
                label="Locked"
                value={lockedCount}
                theme="orange"
              />
              <StatsCard
                icon={Clock}
                label="Pending"
                value={teams.length - markedCount}
                theme="blue"
              />
            </div>

            {/* Search Bar */}
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search teams by name, leader, or members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10"
                  type="search"
                  aria-label="Search teams"
                />
              </div>
            </div>

            {/* Submit All Marks Button */}
            <AlertDialog open={lockAllDialogOpen} onOpenChange={setLockAllDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  className="gap-2 bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                  disabled={lockedCount === teams.length || isLockingAll}
                >
                  <Send className="h-4 w-4" color="white" />
                  <span className="hidden sm:inline text-white">Submit All Marks</span>
                  <span className="sm:hidden text-white">Submit All</span>
                  {teams.length - lockedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-white text-orange-600">
                      {teams.length - lockedCount}
                    </Badge>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    Submit All Marks
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      <p>
                        You are about to submit and lock <span className="font-semibold">all {teams.length}</span> team(s) for this session.
                      </p>
                      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-orange-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold">Warning: This action is permanent!</p>
                            <p className="mt-1">Once submitted, these marks cannot be edited or changed. Make sure all evaluations are correct before proceeding.</p>
                            {teams.length - markedCount > 0 && (
                              <p className="mt-2 font-semibold text-red-600">
                                ⚠️ {teams.length - markedCount} team(s) have not been evaluated and will receive 0 marks.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>• <span className="font-medium">{markedCount}</span> team(s) have been marked</p>
                        <p>• <span className="font-medium">{teams.length - markedCount}</span> team(s) will receive default marks (0)</p>
                        <p>• <span className="font-medium">{lockedCount}</span> team(s) are already locked</p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLockingAll}>Cancel</AlertDialogCancel>
                  <LoadingButton
                    onClick={handleLockAllMarks}
                    loading={isLockingAll}
                    loadingText="Submitting..."
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Yes, Submit All Marks
                  </LoadingButton>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section
        className="container mx-auto px-4 py-8"
        role="main"
        aria-label="Session teams"
      >

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              {searchTerm ? (
                <>
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Teams Match Your Search
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or clear the search to view
                    all teams.
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Teams Assigned
                  </h3>
                  <p className="text-muted-foreground">
                    You don't have any teams assigned in this session yet. Teams
                    will appear here once they are assigned.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team, index) => {
              const markStatus = teamMarks[team.id!];
              const isMarked = markStatus?.marked || false;
              const isLocked = markStatus?.locked || false;
              
              // Determine border color based on status
              const borderColor = isLocked 
                ? "border-l-orange-500" 
                : isMarked 
                ? "border-l-green-500" 
                : "border-l-blue-500";
              
              return (
                <Card
                  key={team.id}
                  className={`cursor-pointer card-hover border-l-4 gap-2 ${borderColor} animate-fade-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleTeamClick(team)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${
                    isLocked
                      ? "View locked marks"
                      : isMarked
                      ? "View or edit marks"
                      : "Add marks"
                  } for ${team.teamName}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {team.teamName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          HC_{team.id}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {isLocked ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-300"
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge variant={isMarked ? "default" : "secondary"}>
                            {isMarked ? "Marked" : "Pending"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
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

                    <LoadingButton 
                      className="w-full" 
                      size="sm" 
                      variant="outline"
                      loading={loadingTeamId === team.id}
                      loadingText="Loading..."
                    >
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
                    </LoadingButton>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

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
          isLoadingMark={isLoadingMark}
        />
      )}
    </div>
  );
}
