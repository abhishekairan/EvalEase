// columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MarksDataType, TeamDataType, TeamMemberDataType, UserDBType } from "@/zod";

// Column definitions for Marks 
export const marksColumns: ColumnDef<MarksDataType>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "teamId.teamName",
    header: "Team Name",
  },
  {
    accessorKey: "jurryId.name",
    header: "Jurry",
  },
  {
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
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
];


// Column definitions for Team 
export const teamColumns: ColumnDef<TeamDataType>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "teamName",
    header: "Team Name",
  },
  {
    accessorKey: "leaderId.name",
    header: "Leader",
  },
  {
    accessorKey: "members",
    header: "Member 1",
    cell: ({row}) => {
      const member = row.getValue("members") as UserDBType[]
      return member[0].name
    }
  },
  {
    accessorKey: "members",
    header: "Member 2",
    cell: ({row}) => {
      const member = row.getValue("members") as UserDBType[]
      return member[1].name
    }
  },
  {
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
    accessorKey: "memberId.id",
    header: "ID",
  },
  {
    accessorKey: "memberId.name",
    header: "Name",
  },
  {
    accessorKey: "teamId.teamName",
    header: "Team",
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
];
