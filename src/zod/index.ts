import {marksDBSchema, MarksDBType} from "@/zod/marksSchema"
import { TeamMemberDBType, teamMemberDBSchema } from "@/zod/teamMemberSchema"
import { TeamDBType,teamSchema } from "@/zod/teamSchema"
import { UserDBType,userDBSchema } from "@/zod/userSchema"

export { marksDBSchema, teamMemberDBSchema, teamSchema, userDBSchema }
export type { MarksDBType, TeamDBType, TeamMemberDBType, UserDBType }