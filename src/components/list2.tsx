"use client";

import {
  UsersRound,
  LogOutIcon,
  Users,
  Crown,
  House
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MarksDialog from "./marks-dialog";
import { logoutAction } from "@/actions/logout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamDataType, MarksDBType } from "@/zod";
import { getExistingMark } from "@/actions/marks";


interface List2Props {
  heading?: string;
  teams?: TeamDataType[];
  juryId?: number;
  sessionId?: number | null;
}

const List2 = ({
  heading = "Assigned Teams",
  teams = [],
  juryId,
  sessionId
}: List2Props) => {
  const [teamList, setTeamList] = useState<TeamDataType[]>(teams);
  const [selectedTeam, setSelectedTeam] = useState<TeamDataType | null>(null);
  const [existingMark, setExistingMark] = useState<MarksDBType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoadingMark, setIsLoadingMark] = useState(false);

  useEffect(() => {
    setTeamList(teams);
  }, [teams]);

  const handleMarksSubmitted = (teamId: number) => {
    setTeamList(prev => 
      prev.map(team => 
        team.id === teamId 
          ? { ...team, isMarked: true }
          : team
      )
    );
    setDialogOpen(false);
    setSelectedTeam(null);
    setExistingMark(null);
  };

  const openMarksDialog = async (team: TeamDataType) => {
    setSelectedTeam(team);
    setIsLoadingMark(true);
    
    // Fetch existing mark if any
    if (juryId && sessionId && team.id) {
      try {
        const result = await getExistingMark({ 
          teamId: team.id, 
          juryId: juryId,
          sessionId: sessionId
        });
        
        if (result.success && result.mark) {
          setExistingMark(result.mark);
        } else {
          setExistingMark(null);
        }
      } catch (error) {
        console.error("Error fetching existing marks:", error);
        setExistingMark(null);
      }
    }
    
    setIsLoadingMark(false);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedTeam(null);
    setExistingMark(null);
  };

  if (teamList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{heading}</h1>
            <form action={logoutAction}>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                >
                <LogOutIcon className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
          
          <Card className="text-center py-12">
            <CardContent>
              <UsersRound className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Teams Assigned Yet
              </h3>
              <p className="text-gray-500">
                Teams will be allocated to you soon. Please check back later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{heading}</h1>
            <p className="text-gray-600 mt-1">
              {teamList.length} team{teamList.length !== 1 ? 's' : ''} assigned
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutAction()}
            className="flex items-center gap-2"
          >
            <LogOutIcon className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamList.map((team) => (
            <Card 
              key={team.id} 
              className={`transition-all duration-200 hover:shadow-lg gap-4 'bg-white border-gray-200 hover:border-blue-300'`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-900 truncate">
                    {team.teamName}
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Team Leader</p>
                      <p className="text-sm text-gray-600">{team.leaderId.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Members</p>
                      <p className="text-sm text-gray-600">
                        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <House className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Room</p>
                      <p className="text-sm text-gray-600">
                        {team.room}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={() => openMarksDialog(team)}
                  disabled={isLoadingMark}
                  className={`w-full bg-blue-600 hover:bg-blue-700`}>
                  {isLoadingMark ? 'Loading...' : 'Enter Marks'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTeam && (
          <MarksDialog
            open={dialogOpen}
            onClose={closeDialog}
            team={selectedTeam}
            juryId={juryId}
            sessionId={sessionId}
            onMarksSubmitted={handleMarksSubmitted}
            existingMark={existingMark}
          />
        )}
      </div>
    </div>
  );
};

export { List2 };
