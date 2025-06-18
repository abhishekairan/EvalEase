import { List2 } from "@/components/list2";
import { getTeamsForJury } from "@/actions/jury-teams";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Homepage() {
  // Get current jury member from session
  const jury = await auth();
  if (!jury) {
    redirect("/login");
  }

  // Get teams assigned to this jury member
  const teamsData = await getTeamsForJury(Number(jury.user.id), Number(jury.user.session));

  return (
    <List2 
      teams={teamsData} 
      juryId={Number(jury.user.id)}
      sessionId={Number(jury.user.session)}
    />
  );
}
