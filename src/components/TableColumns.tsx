// columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MarksDataType, TeamDataType, TeamMemberDataType, UserDBType } from "@/zod";

// Column definitions for Marks 
export const marksColumns: ColumnDef<MarksDataType>[] = [
  {
    id:"marksColumnID",
    accessorKey: "id",
    header: "ID",
  },
  {
    id:"marksColumnTeamName",
    accessorKey: "teamId.teamName",
    header: "Team Name",
  },
  {
    id:"marksColumnJurryName",
    accessorKey: "jurryId.name",
    header: "Jurry",
  },
  {
    id:"marksColumnDay",
    accessorKey: "createdAt",
    header: "Day",
    cell: ({ row }) => {
      const status = row.getValue("createdAt") as Date;
      return (
        <Badge variant={"secondary"}>
          {status.getDay() > 28 ? "Day 1" : "Day 2"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "innovationScore",
    header: "Innovation Score",
  },
  {
    accessorKey: "presentationScore",
    header: "Presentation Score",
  },
  {
    accessorKey: "technicalScore",
    header: "Technical Score",
  },
  {
    accessorKey: "impactScore",
    header: "Impact Score",
  },
  {
    header: "Total Score",
    cell: ({ row }) => {
      const score = (row.getValue("innovationScore") as number) + (row.getValue("innovationScore") as number) + (row.getValue("innovationScore") as number) + (row.getValue("innovationScore") as number);
      return (
        <Badge variant={"secondary"}>
          {score}
        </Badge>
      );
    },
  },
];


// Column definitions for jurry 
export const jurryColumns: ColumnDef<UserDBType>[] = [
  {
    id:"jurryColumnsID",
    accessorKey: "id",
    header: "ID",
  },
  {
    id:"jurryColumnsName",
    accessorKey: "name",
    header: "Name",
  },
  {
    id:"jurryColumnsPhoneNumber",
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    id:"jurryColumnsEmail",
    accessorKey: "email",
    header: "Email",
  },
];


// Column definitions for Team 
export const teamColumns: ColumnDef<TeamDataType>[] = [
  {
    id:"teamColumnsID",
    accessorKey: "id",
    header: "ID",
  },
  {
    id:"teamColumnsTeamName",
    accessorKey: "teamName",
    header: "Team Name",
  },
  {
    id:"teamColumnsLeaderName",
    accessorKey: "leaderId.name",
    header: "Leader",
  },
  {
    id:"teamColumnsMember1",
    accessorKey: "members",
    header: "Member 1",
    cell: ({row}) => {
      const member = row.getValue("members") as UserDBType[]
      return member[0].name
    }
  },
  {
    id:"teamColumnsMember2",
    accessorKey: "members",
    header: "Member 2",
    cell: ({row}) => {
      const member = row.getValue("members") as UserDBType[]
      return member[1].name
    }
  },
  {
    id:"teamColumnsMember3",
    accessorKey: "members",
    header: "Member 3",
    cell: ({row}) => {
      const member = row.getValue("members") as UserDBType[]
      return member[2].name
    }
  }
];


// Column definitions for participants 
export const participantsColumns: ColumnDef<TeamMemberDataType>[] = [
  {
    id:"participantsColumnsID",
    accessorKey: "memberId.id",
    header: "ID",
  },
  {
    id:"participantsColumnsMemberName",
    accessorKey: "memberId.name",
    header: "Name",
  },
  {
    id:"participantsColumnsTeamName",
    accessorKey: "teamId.teamName",
    header: "Team",
  },
  {
    id:"participantsColumnsPhoneNumber",
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    id:"participantsColumnsEmail",
    accessorKey: "email",
    header: "Email",
  },
];
