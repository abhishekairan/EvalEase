import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSessionsForJury, getTeamsWithData, getSessionById } from "@/db/utils";
import { SessionTeamsView } from "@/components/SessionTeamsView";
import { getTeamsMarksStatus } from "@/actions/marks";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    sessionId: string;
  };
}

export default async function SessionPage({ params }: PageProps) {
  // Verify user is logged in
  const jury = await auth();
  if (!jury) {
    redirect("/login");
  }

  const juryId = Number(jury.user.id);
  const resolvedParams = await params;
  const sessionId = Number(resolvedParams.sessionId);

  // Get session details
  const session = await getSessionById(sessionId);
  if (!session) {
    redirect("/home");
  }

  // Verify jury is assigned to this session
  const jurySessions = await getSessionsForJury({ juryId });
  const isAssigned = jurySessions.some((s) => s.id === sessionId);
  
  if (!isAssigned) {
    redirect("/home");
  }

  // Check session status
  const now = new Date();
  const startedAt = session.startedAt ? new Date(session.startedAt) : null;
  const endedAt = session.endedAt ? new Date(session.endedAt) : null;

  // Don't allow access if session hasn't started or has ended
  if (!startedAt || startedAt > now) {
    redirect("/home");
  }

  if (endedAt && endedAt < now) {
    redirect("/home");
  }

  // Get teams assigned to this jury in this session
  const allTeams = await getTeamsWithData();
  // Note: Teams don't have a session field - they're assigned to jury members globally
  // The session context is maintained through marks and jury_sessions junction table
  const juryTeams = allTeams.filter(
    (team) => team.juryId === juryId
  );

  // Get marks status for all teams
  const teamIds = juryTeams.map(team => team.id!).filter(id => id !== undefined);
  const marksStatusResult = await getTeamsMarksStatus({
    juryId,
    sessionId: session.id!,
    teamIds,
  });

  return (
    <SessionTeamsView
      juryName={jury.user.name}
      juryId={juryId}
      session={{
        id: session.id!,
        name: session.name,
        startedAt,
        endedAt,
      }}
      teams={juryTeams}
      initialMarksStatus={marksStatusResult.marksStatus}
    />
  );
}
