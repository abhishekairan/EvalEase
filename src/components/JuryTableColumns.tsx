"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { juryDBType } from "@/zod/userSchema";
import { Edit, Trash2 } from "lucide-react";
import { ConfirmDeleteTJuryAlert } from "./alerts/ConfirmDeleteAlert";
import { EditJurySessionsDialog } from "./Dialogs/EditJurySessionsDialog";

interface Session {
  id: number;
  name: string;
}

interface JuryWithSessions extends Omit<juryDBType, 'session'> {
  sessions: Session[];
}

export function createJuryColumnsWithSessions(allSessions: Session[]): ColumnDef<JuryWithSessions>[] {
  return [
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
      enableSorting: false,
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
      cell: ({ row }) => {
        const sessions = row.original.sessions;
        if (!sessions || sessions.length === 0) {
          return <Badge variant="secondary">No Sessions</Badge>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {sessions.map((session) => (
              <Badge key={session.id} variant="default">
                {session.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "jurryColumnsActions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <EditJurySessionsDialog
              juryId={row.original.id || 0}
              juryName={row.original.name}
              currentSessions={row.original.sessions || []}
              allSessions={allSessions}
            >
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
            </EditJurySessionsDialog>
            
            <ConfirmDeleteTJuryAlert
              id={row.original.id || 0}
              description={`Are you sure you want to delete ${row.original.name}'s record?`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </ConfirmDeleteTJuryAlert>
          </div>
        );
      },
    },
  ];
}
