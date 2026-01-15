import { JurySessionsView } from "@/components/JurySessionsView2";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSessionsForJury, getTeamsBySession } from "@/db/utils";

export const dynamic = "force-dynamic";

export default async function Homepage() {
  // Get current jury member from session
  const jury = await auth();
  if (!jury) {
    redirect("/login");
  }

  const juryId = Number(jury.user.id);

  // Get all sessions assigned to this jury member
  const sessions = await getSessionsForJury({ juryId });

  // Determine session status and get team counts
  const sessionsData = await Promise.all(
    sessions.map(async (session) => {
      const now = new Date();
      const startedAt = session.startedAt ? new Date(session.startedAt) : null;
      const endedAt = session.endedAt ? new Date(session.endedAt) : null;

      let status: "upcoming" | "started" | "past";
      if (!startedAt) {
        status = "upcoming";
      } else if (endedAt) {
        status = "past";
      } else if (startedAt && startedAt <= now) {
        status = "started";
      } else {
        status = "upcoming";
      }

      // Get team count for this session and jury
      const teams = await getTeamsBySession(session.id!);
      const juryTeams = teams.filter(team => team.juryId === juryId);

      return {
        id: session.id!,
        name: session.name,
        startedAt,
        endedAt,
        status,
        teamCount: juryTeams.length,
      };
    })
  );

  return (
    <JurySessionsView
      juryName={jury.user.name}
      sessions={sessionsData}
    />
  );
}
