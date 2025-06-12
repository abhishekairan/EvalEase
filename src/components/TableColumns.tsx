// columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MarksDataType, TeamDataType, TeamMemberDataType, UserDBType, userWithTeamType } from "@/zod";

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
    accessorKey: "juryId.name",
    header: "Jurry",
  },{
  id: "marksColumnDay",
  header: "Day",
  accessorFn: (row) => {
    const date = row.createdAt as Date;
    return date.getDate(); // Return raw day value, not JSX
  },
  cell: ({ getValue }) => {
    const day = getValue() as number;
    return (
      <Badge variant="outline">
        {day < 15 ? "Day 1" : "Day 2"}
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
    header: "Member 1",
    accessorFn: (row) =>{
      return row.members[0].name
    },
    cell: ({getValue}) => {
      return getValue()
    }
  },
  {
    id:"teamColumnsMember2",
    accessorKey: "members",
    header: "Member 2",
    accessorFn: (row) =>{
      const member = row.members[1]
      return member? member.name : '-'
    },
    cell: ({getValue}) => {
      return getValue()
    }
  },
  {
    id:"teamColumnsMember3",
    accessorKey: "members",
    header: "Member 3",
    accessorFn: (row) =>{
      const member = row.members[2]
      return member? member.name : '-'
    },
    cell: ({getValue}) => {
      return getValue()
    }
  }
];


// Column definitions for participants 
export const participantsColumns: ColumnDef<userWithTeamType>[] = [
  {
    id:"participantsColumnsID",
    accessorKey: "id",
    header: "ID",
  },
  {
    id:"participantsColumnsMemberName",
    accessorKey: "name",
    header: "Name",
  },
  {
    id:"participantsColumnsTeamName",
    header: "Team",
    accessorFn: (key)=>{
      return key.teamName? key.teamName : "-"
    },
    cell: ({getValue}) => {
      return getValue()
    }
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
