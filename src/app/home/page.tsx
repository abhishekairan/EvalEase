import { List2 } from "@/components/list2";
import { getTeamsForJury } from "@/actions/jury-teams";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSessionById } from "@/db/utils";

export const dynamic = "force-dynamic";

export default async function Homepage() {
  // Get current jury member from session
  const jury = await auth();
  if (!jury) {
    redirect("/login");
  }
  // Getting session 
  let teamsData: any[] = []
  if(jury.user.session != 'null'){

    const session =await getSessionById(Number(jury.user.session))
    // Get teams assigned to this jury member
    // console.log(jury.user.session)
    if(session?.startedAt && !(session?.endedAt)) {
      teamsData = await getTeamsForJury(Number(jury.user.id));
    }
  }
  
  // console.log("teamData:",teamsData)
  return (
    <List2 
      teams={teamsData} 
      heading = {`Welcome, ${jury.user.name}`}
      juryId={Number(jury.user.id)}
      sessionId={Number(jury.user.session)}
    />
  );
}
