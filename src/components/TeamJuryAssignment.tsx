// components/TeamJuryAssignment.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Users, UserCheck, Search, Filter, X, ChevronLeft, ChevronRight, Plus, AlertTriangle } from "lucide-react";
import { TeamDataType, juryDBType } from "@/zod";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface TeamJuryAssignmentProps {
  teams: TeamDataType[];
  jury: juryDBType[]; // Currently selected jury
  allJury?: juryDBType[]; // All available jury members
  onAssignmentsChange: (assignments: Map<number, number>) => void;
  onJuryAdd?: (juryId: number) => void;
  onJuryRemove?: (juryId: number) => void;
  initialAssignments?: Map<number, number>; // teamId -> juryId
}

export function TeamJuryAssignment({
  teams,
  jury,
  allJury,
  onAssignmentsChange,
  onJuryAdd,
  onJuryRemove,
  initialAssignments = new Map(),
}: TeamJuryAssignmentProps) {
  const [assignments, setAssignments] = useState<Map<number, number>>(
    new Map(initialAssignments)
  );
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState<string>("all");
  const [selectedVenue, setSelectedVenue] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Configurable pagination
  const [showShuffleDialog, setShowShuffleDialog] = useState(false);
  
  // Debounced search for performance
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Extract unique institutes and venues for filter dropdowns
  const { institutes, venues } = useMemo(() => {
    const instituteSet = new Set<string>();
    const venueSet = new Set<string>();
    
    teams.forEach(team => {
      if (team.leaderId.institude) instituteSet.add(team.leaderId.institude);
      if (team.room) venueSet.add(team.room);
    });
    
    return {
      institutes: Array.from(instituteSet).sort(),
      venues: Array.from(venueSet).sort(),
    };
  }, [teams]);

  // Optimized filtering with useMemo
  const filteredTeams = useMemo(() => {
    let filtered = teams;
    
    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(team => 
        team.teamName.toLowerCase().includes(query) ||
        team.leaderId.name.toLowerCase().includes(query) ||
        team.leaderId.institude?.toLowerCase().includes(query) ||
        team.room?.toLowerCase().includes(query)
      );
    }
    
    // Apply institute filter
    if (selectedInstitute !== "all") {
      filtered = filtered.filter(team => team.leaderId.institude === selectedInstitute);
    }
    
    // Apply venue filter
    if (selectedVenue !== "all") {
      filtered = filtered.filter(team => team.room === selectedVenue);
    }
    
    return filtered;
  }, [teams, debouncedSearch, selectedInstitute, selectedVenue]);

  // Pagination
  const paginatedTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTeams.slice(startIndex, endIndex);
  }, [filteredTeams, currentPage]);

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const juryTeamCount = new Map<number, number>();
    jury.forEach((j) => juryTeamCount.set(j.id!, 0));

    assignments.forEach((juryId) => {
      juryTeamCount.set(juryId, (juryTeamCount.get(juryId) || 0) + 1);
    });

    return {
      assignedTeams: assignments.size,
      totalTeams: teams.length,
      unassignedTeams: teams.length - assignments.size,
      filteredCount: filteredTeams.length,
      juryTeamCount,
    };
  }, [assignments, teams.length, filteredTeams.length, jury]);

  const handleAssignment = (teamId: number, juryId: number | null) => {
    const newAssignments = new Map(assignments);

    if (juryId === null) {
      newAssignments.delete(teamId);
    } else {
      newAssignments.set(teamId, juryId);
    }

    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
  };

  const handleShuffleConfirm = useCallback(() => {
    const newAssignments = new Map<number, number>();
    const juryIds = jury.map((j) => j.id!);

    // Shuffle filtered teams or all teams - this OVERWRITES all existing assignments
    const teamsToShuffle = filteredTeams.length < teams.length ? filteredTeams : teams;
    
    teamsToShuffle.forEach((team, index) => {
      const juryIndex = index % juryIds.length;
      newAssignments.set(team.id!, juryIds[juryIndex]);
    });

    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
    setShowShuffleDialog(false);
    toast.success(`${teamsToShuffle.length} teams distributed among ${jury.length} jury members`);
  }, [jury, filteredTeams, teams, onAssignmentsChange]);

  const handleShuffle = useCallback(() => {
    if (jury.length === 0) {
      toast.error("No jury members available for shuffling");
      return;
    }

    // Show confirmation dialog before shuffling
    setShowShuffleDialog(true);
  }, [jury.length]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedInstitute("all");
    setSelectedVenue("all");
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    const newAssignments = new Map<number, number>();
    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
    toast.info("All assignments cleared");
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleInstituteChange = (value: string) => {
    setSelectedInstitute(value);
    setCurrentPage(1);
  };

  const handleVenueChange = (value: string) => {
    setSelectedVenue(value);
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    debouncedSearch,
    selectedInstitute !== "all",
    selectedVenue !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard - Optimized for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5" />
              Assignment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-medium mb-1">
                  Assigned
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.assignedTeams}
                  <span className="text-sm font-normal text-blue-600">
                    /{stats.totalTeams}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-xs text-yellow-600 font-medium mb-1">
                  Unassigned
                </div>
                <div className="text-2xl font-bold text-yellow-700">
                  {stats.unassignedTeams}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium mb-1">
                  Jury Members
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {jury.length}
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">
                  Filtered
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {stats.filteredCount}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShuffle}
                className="flex items-center gap-2"
              >
                <Shuffle className="h-4 w-4" />
                {filteredTeams.length < teams.length ? "Shuffle Filtered" : "Auto Shuffle"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jury Load Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Jury Load Distribution ({jury.length})
              </CardTitle>
              {allJury && onJuryAdd && (
                <Select
                  value=""
                  onValueChange={(value) => {
                    const juryId = parseInt(value);
                    onJuryAdd(juryId);
                  }}
                >
                  <SelectTrigger className="w-12 h-9 p-0 border-dashed">
                    <div className="flex items-center justify-center w-full">
                      <Plus className="h-4 w-4" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {allJury
                      .filter(j => j.session === null && !jury.some(selected => selected.id === j.id))
                      .map((j) => (
                        <SelectItem key={j.id} value={j.id!.toString()}>
                          {j.name}
                        </SelectItem>
                      ))}
                    {allJury.filter(j => j.session === null && !jury.some(selected => selected.id === j.id)).length === 0 && (
                      <div className="px-2 py-6 text-center text-sm text-gray-500">
                        No more jury available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
              {jury.map((j) => {
                const count = stats.juryTeamCount.get(j.id!) || 0;
                return (
                  <div
                    key={j.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{j.name}</p>
                      <p className="text-xs text-gray-600 truncate">{j.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={count === 0 ? "secondary" : "default"}>
                        {count}
                      </Badge>
                      {onJuryRemove && (
                        <button
                          type="button"
                          onClick={() => onJuryRemove(j.id!)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 rounded-full p-1"
                          title="Remove jury member"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {jury.length === 0 && (
                <p className="text-center text-gray-500 py-8 text-sm">
                  {allJury && onJuryAdd ? "Click + to add jury members" : "No jury members selected"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters - Optimized for Desktop */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Team Assignments</CardTitle>
              <CardDescription>
                Search and filter {teams.length} teams
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by team name, leader, institute, or venue..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Institute
                </label>
                <Select
                  value={selectedInstitute}
                  onValueChange={handleInstituteChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Institutes</SelectItem>
                    {institutes.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Venue
                </label>
                <Select
                  value={selectedVenue}
                  onValueChange={handleVenueChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Venues</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue} value={venue}>
                        {venue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Results Count and Items Per Page */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="text-sm text-gray-600">
              Showing {paginatedTeams.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredTeams.length)} of {filteredTeams.length} teams
              {filteredTeams.length !== teams.length && (
                <span className="text-gray-500"> (filtered from {teams.length})</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page Navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Team Assignment Grid - Desktop Optimized */}
          <div className="space-y-2">
            {paginatedTeams.map((team) => {
              const assignedJuryId = assignments.get(team.id!);
              const assignedJury = jury.find((j) => j.id === assignedJuryId);

              return (
                <div
                  key={team.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  {/* Team Info - Takes more space on desktop */}
                  <div className="lg:col-span-5 space-y-1">
                    <h4 className="font-semibold text-sm">{team.teamName}</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.leaderId.name}
                      </span>
                      {team.leaderId.institude && (
                        <Badge variant="outline" className="text-xs">
                          {team.leaderId.institude}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Venue - Desktop only */}
                  <div className="hidden lg:flex lg:col-span-2 items-center">
                    {team.room ? (
                      <Badge variant="secondary" className="text-xs">
                        {team.room}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">No venue</span>
                    )}
                  </div>

                  {/* Assignment Select */}
                  <div className="lg:col-span-4 flex items-center">
                    <Select
                      value={assignedJuryId?.toString() || "unassigned"}
                      onValueChange={(value) => {
                        const juryId = value === "unassigned" ? null : parseInt(value);
                        handleAssignment(team.id!, juryId);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select jury member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {jury.map((j) => (
                          <SelectItem key={j.id} value={j.id!.toString()}>
                            {j.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Badge - Desktop only */}
                  <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
                    {assignedJury && (
                      <Badge variant="outline" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}

            {paginatedTeams.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No teams found</p>
                <p className="text-sm mt-1">
                  {filteredTeams.length === 0 && teams.length > 0
                    ? "Try adjusting your filters"
                    : "Please create teams before assigning them"}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Pagination - Enhanced */}
          {totalPages > 1 && paginatedTeams.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              {/* Left: Jump to page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Go to:</span>
                <Select
                  value={currentPage.toString()}
                  onValueChange={(value) => setCurrentPage(parseInt(value))}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <SelectItem key={page} value={page.toString()}>
                        {page}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>

              {/* Center: Page numbers */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        type="button"
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>

              {/* Right: Items info */}
              <div className="text-sm text-gray-600">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredTeams.length)} of {filteredTeams.length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shuffle Confirmation Dialog */}
      <AlertDialog open={showShuffleDialog} onOpenChange={setShowShuffleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Auto Shuffle
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base font-medium text-gray-900">
                Are you sure you want to auto-shuffle teams?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <p className="text-sm text-amber-900 font-medium flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Warning: This action will:</span>
                </p>
                <ul className="text-sm text-amber-800 space-y-1 ml-6 list-disc">
                  <li>Redistribute <strong>{filteredTeams.length < teams.length ? filteredTeams.length : teams.length} teams</strong> among <strong>{jury.length} jury members</strong></li>
                  <li><strong>Overwrite all existing assignments</strong></li>
                  <li>Assign teams evenly in a randomized order</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                This action cannot be undone. You can manually reassign teams after shuffling if needed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleShuffleConfirm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Yes, Shuffle Teams
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
