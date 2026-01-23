"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MarksDataType, TeamDataType, juryDBType, participantsWithTeamType } from "@/zod";
import { Trash2 } from "lucide-react";
import { ConfirmDeleteTeamAlert, ConfirmDeleteTJuryAlert, ConfirmDeleteTParticipantAlert } from "./alerts/ConfirmDeleteAlert";

// Column definitions for Marks
export const marksColumns: ColumnDef<MarksDataType>[] = [
  {
    id: "marksColumnID",
    accessorKey: "id",
    header: "ID",
    enableSorting: false, // Enable sorting for ID
  },
  {
    id: "marksColumnTeamName",
    accessorKey: "teamId.teamName",
    header: "Team Name",
    enableSorting: false, // Enable sorting for team name
  },
  {
    id: "marksColumnJurryName",
    accessorKey: "juryId.name",
    header: "Jury",
    enableSorting: true, // Enable sorting for jury name
  },
  {
    id: "marksColumnDay",
    accessorKey: "session.name",
    header: "Session",
    enableSorting: true, // Enable sorting for session
  },
  {
    accessorKey: "feasibilityScore",
    header: "Feasibility",
    enableSorting: false, // Enable sorting for scores
    cell: (value) => {
      const score = value.getValue() as number;
      let variant: "default" | "secondary" | "destructive" | "outline" | "red" | "green" | "orange" = "destructive";
      if (score < 10) variant = "red";
      if (score >= 10 && score < 18) variant = "orange";
      if (score >= 18) variant = "green";
      return <Badge variant={variant}>{score}</Badge>;
    },
  },
  {
    accessorKey: "techImplementationScore",
    header: "Tech Implementation",
    enableSorting: false,
    cell: (value) => {
      const score = value.getValue() as number;
      let variant: "default" | "secondary" | "destructive" | "outline" | "red" | "green" | "orange" = "destructive";
      if (score < 10) variant = "red";
      if (score >= 10 && score < 18) variant = "orange";
      if (score >= 18) variant = "green";
      return <Badge variant={variant}>{score}</Badge>;
    },
  },
  {
    accessorKey: "innovationCreativityScore",
    header: "Innovation & Creativity",
    enableSorting: false,
    cell: (value) => {
      const score = value.getValue() as number;
      let variant: "default" | "secondary" | "destructive" | "outline" | "red" | "green" | "orange" = "destructive";
      if (score < 10) variant = "red";
      if (score >= 10 && score < 18) variant = "orange";
      if (score >= 18) variant = "green";
      return <Badge variant={variant}>{score}</Badge>;
    },
  },
  {
    accessorKey: "problemRelevanceScore",
    header: "Problem Relevance",
    enableSorting: false,
    cell: (value) => {
      const score = value.getValue() as number;
      let variant: "default" | "secondary" | "destructive" | "outline" | "red" | "green" | "orange" = "destructive";
      if (score < 10) variant = "red";
      if (score >= 10 && score < 18) variant = "orange";
      if (score >= 18) variant = "green";
      return <Badge variant={variant}>{score}</Badge>;
    },
  },
  {
    header: "Total Score",
    enableSorting: true, // Enable sorting for total score
    accessorFn: (row) => {
      return row.feasibilityScore + row.techImplementationScore + row.innovationCreativityScore + row.problemRelevanceScore;
    },
    cell: ({ getValue }) => {
      const score = getValue() as number;
      return <Badge variant="secondary">{score}</Badge>;
    },
  },
];

// Column definitions for jury
export const jurryColumns: ColumnDef<juryDBType>[] = [
  {
    id: "jurryColumnsID",
    accessorKey: "id",
    header: "ID",
    enableSorting: false,
  },
  {
    id: "jurryColumnsName",
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
  },
  {
    id: "jurryColumnsPhoneNumber",
    accessorKey: "phoneNumber",
    header: "Phone Number",
    enableSorting: false, // Disable sorting for phone numbers
  },
  {
    id: "jurryColumnsEmail",
    accessorKey: "email",
    header: "Email",
    enableSorting: false,
  },
  {
    id: "jurryColumnsRole",
    accessorKey: "role",
    header: "Role",
    enableSorting: true,
    cell: (value) => {
      const role = value.getValue() as string;
      return <Badge variant={role === "jury" ? "green" : "orange"}>{role}</Badge>;
    },
  },
  {
    id: "jurryColumnsSession",
    accessorKey: "sessions",
    header: "Sessions",
    enableSorting: true,
    cell: (value) => {
      const sessions = value.getValue() as Array<{ id: number; name: string }> | undefined;
      if (!sessions || sessions.length === 0) {
        return <Badge variant="secondary">No Sessions</Badge>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {sessions.map((session) => (
            <Badge key={session.id} variant="default">{session.name}</Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "jurryColumnsActions",
    header: "Actions",
    enableSorting: false, // Disable sorting for actions
    cell: ({ row }) => {
      return (
        <span
          // onClick={() => meta?.deleteTeam?.(team.id)}
          className="text-red-600 focus:text-red-600 cursor-pointer hover:drop-shadow-2xl hover:drop-shadow-red-500"
        >
          <ConfirmDeleteTJuryAlert id={row.original.id? row.original.id : 0} description={`Are you sure you want to delete ${row.original.name}'s record?`}>
            <Trash2 className="mr-2 h-5 w-5" />
          </ConfirmDeleteTJuryAlert>
        </span>
      );
    },
  },
];

// Column definitions for Team
export const teamColumns: ColumnDef<TeamDataType>[] = [
  {
    id: "teamColumnsID",
    accessorKey: "id",
    header: "ID",
    enableSorting: false,
    cell: ({row})=>{
      return <>PU_{row.original.id}</>
    }
  },
  {
    id: "teamColumnsTeamName",
    accessorKey: "teamName",
    header: "Team Name",
    enableSorting: false,
  },
  {
    id: "teamColumnsLeaderName",
    accessorKey: "leaderId.name",
    header: "Leader",
    enableSorting: false,
  },
  {
    id: "teamColumnsMember1",
    header: "Member 1",
    enableSorting: false,
    accessorFn: (row) => {
      // Filter out leader from members
      const nonLeaderMembers = row.members.filter(m => m.id !== row.leaderId?.id);
      const member = nonLeaderMembers[0];
      return member ? member.name : "-";
    },
    cell: ({ getValue }) => {
      return getValue();
    },
  },
  {
    id: "teamColumnsMember2",
    header: "Member 2",
    enableSorting: false,
    accessorFn: (row) => {
      // Filter out leader from members
      const nonLeaderMembers = row.members.filter(m => m.id !== row.leaderId?.id);
      const member = nonLeaderMembers[1];
      return member ? member.name : "-";
    },
    cell: ({ getValue }) => {
      return getValue();
    },
  },
  {
    id: "teamColumnsMember3",
    header: "Member 3",
    enableSorting: false,
    accessorFn: (row) => {
      // Filter out leader from members
      const nonLeaderMembers = row.members.filter(m => m.id !== row.leaderId?.id);
      const member = nonLeaderMembers[2];
      return member ? member.name : "-";
    },
    cell: ({ getValue }) => {
      return getValue();
    },
  },
  {
    id: "teamColumnsRoom",
    header: "Room",
    enableSorting: true,
    cell: ({ row }) => {
      return <Badge variant={"outline"}>{row.original.room}</Badge>;
    },
  },
  {
    id: "teamColumnsActions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <span
          // onClick={() => meta?.deleteTeam?.(team.id)}
          className="text-red-600 focus:text-red-600 cursor-pointer hover:drop-shadow-2xl hover:drop-shadow-red-500"
        >
          <ConfirmDeleteTeamAlert id={row.original.id? row.original.id : 0} description={`Are you sure you want to delete ${row.original.teamName}'s record?`}>
            <Trash2 className="mr-2 h-5 w-5" />
          </ConfirmDeleteTeamAlert>
        </span>
      );
    },
  },
];

// Column definitions for participants
export const participantsColumns: ColumnDef<participantsWithTeamType>[] = [
  {
    id: "participantsColumnsID",
    accessorKey: "id",
    header: "ID",
    enableSorting: false,
  },
  {
    id: "participantsColumnsMemberName",
    accessorKey: "name",
    header: "Name",
    enableSorting: false,
  },
  {
    id: "participantsColumnsInstitudeName",
    accessorKey: "institude",
    header: "Institute",
    enableSorting: true,
  },
  {
    id: "participantsColumnsTeamName",
    header: "Team",
    enableSorting: true,
    accessorFn: (key) => {
      return key.teamName ? key.teamName : "-";
    },
    cell: ({ getValue }) => {
      const teamName = getValue() as string;
      return teamName === "-" ? (
        <Badge variant="outline">No Team</Badge>
      ) : (
        <Badge variant="outline">{teamName}</Badge>
      );
    },
  },
  {
    id: "participantsColumnsPhoneNumber",
    accessorKey: "phoneNumber",
    header: "Phone Number",
    enableSorting: false,
  },
  {
    id: "participantsColumnsEmail",
    accessorKey: "email",
    header: "Email",
    enableSorting: false,
  },
  {
    id: "participantsColumnsActions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      return (
        <span
          // onClick={() => meta?.deleteTeam?.(team.id)}
          className="text-red-600 focus:text-red-600 cursor-pointer hover:drop-shadow-2xl hover:drop-shadow-red-500"
        >
          <ConfirmDeleteTParticipantAlert id={row.original.id? row.original.id : 0} description={`Are you sure you want to delete ${row.original.name}'s record?`}>
            <Trash2 className="mr-2 h-5 w-5" />
          </ConfirmDeleteTParticipantAlert>
        </span>
      );
    },
  },
];
