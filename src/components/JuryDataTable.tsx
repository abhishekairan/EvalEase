"use client";

import { DataTable } from "@/components/data-table";
import { createJuryColumnsWithSessions } from "@/components/JuryTableColumns";

interface Session {
  id: number;
  name: string;
}

interface JuryWithSessions {
  id?: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  sessions: Session[];
}

interface JuryDataTableProps {
  data: JuryWithSessions[];
  sessions: Session[];
}

export function JuryDataTable({ data, sessions }: JuryDataTableProps) {
  const columns = createJuryColumnsWithSessions(sessions);
  return <DataTable columns={columns} data={data} />;
}
