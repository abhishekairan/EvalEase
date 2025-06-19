import { List2 } from "@/components/list2";
import { getTeamsForJury } from "@/actions/jury-teams";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSessionById } from "@/db/utils";

export default async function Homepage() {
  // Get current jury member from session
  const jury = await auth();
  if (!jury) {
    redirect("/login");
  }
  // Getting session 
  const session =await getSessionById(Number(jury.user.session))

  // Get teams assigned to this jury member
  let teamsData: any[] = []
  // console.log(jury.user.session)
  if(jury.user.session != 'null' && session?.startedAt && !(session?.endedAt)) {
    teamsData = await getTeamsForJury(Number(jury.user.id));
  }
  
  // console.log("teamData:",teamsData)
  return (
    <List2 
      teams={teamsData} 
      juryId={Number(jury.user.id)}
      sessionId={Number(jury.user.session)}
    />
  );
}
