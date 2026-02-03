// Seed teams and participants from CSV file (Stall Allotment Tech Expo 2026.csv)
import "dotenv/config"
import * as XLSX from "xlsx"
import path from "path"
import { db } from "../src/db/index"
import {
  participants,
  teamMembers,
  teams,
} from "../src/db/schema"
import { eq, and } from "drizzle-orm"

// Interface matching CSV columns
interface CSVRow {
  "Project ID": string | number
  Dome: string | number
  Stall: string | number
  Institute: string
  Department: string
  "Team Name": string
  "Project Name": string
  "Student Name": string
  "Phone No.": string | number
  "Email Id": string
  Semester: string | number
  "Mentor Name": string
  "Mentor Phone No.": string | number
  "Mentor Email": string
}

// Processed team structure
interface Team {
  projectId: string
  institute: string
  teamName: string
  members: {
    name: string
    phone: string
    email: string
    isLeader: boolean
  }[]
}

// Project ID prefix
const PROJECT_ID_PREFIX = "TE-"

// CSV file path
const CSV_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "TechExpo_Teams_unformatted.csv"
)

function readTeamsFromCSV(): Team[] {
  // Read CSV using xlsx library
  const workbook = XLSX.readFile(CSV_FILE_PATH)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // Convert to JSON with headers
  const records: CSVRow[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "", // Default empty values to empty string
  })

  const teamsList: Team[] = []
  let currentTeam: Team | null = null

  for (const row of records) {
    // Skip completely empty rows
    const studentName = String(row["Student Name"] || "").trim()
    const projectId = String(row["Project ID"] || "").trim()
    
    if (!studentName && !projectId) continue

    // If Project ID is present, this is a new team (leader row)
    if (projectId && projectId !== "") {
      // Save previous team if exists
      if (currentTeam && currentTeam.members.length > 0) {
        teamsList.push(currentTeam)
      }

      // Create new team with TE- prefix
      const teamName = String(row["Team Name"] || "").trim() || `Team ${PROJECT_ID_PREFIX}${projectId}`
      const institute = String(row.Institute || "").trim()
      
      currentTeam = {
        projectId: `${PROJECT_ID_PREFIX}${projectId}`,
        institute: institute,
        teamName: teamName,
        members: [],
      }

      // Add leader as first member
      if (studentName) {
        currentTeam.members.push({
          name: studentName,
          phone: String(row["Phone No."] || "").trim(),
          email: String(row["Email Id"] || "").trim(),
          isLeader: true,
        })
      }
    } else if (currentTeam && studentName) {
      // This is a team member row (no Project ID means continuation)
      currentTeam.members.push({
        name: studentName,
        phone: String(row["Phone No."] || "").trim(),
        email: String(row["Email Id"] || "").trim(),
        isLeader: false,
      })
    }
  }

  // Don't forget the last team
  if (currentTeam && currentTeam.members.length > 0) {
    teamsList.push(currentTeam)
  }

  return teamsList
}

async function seedTeamsAndParticipants() {
  console.log("🌱 Starting seeding from CSV...")
  console.log(`📄 Reading from: ${CSV_FILE_PATH}`)

  const teamsList = readTeamsFromCSV()
  console.log(`📊 Found ${teamsList.length} teams in CSV`)

  let teamsCreated = 0
  let participantsCreated = 0
  let teamMembersLinked = 0

  for (const team of teamsList) {
    try {
      // First, create all participants for this team
      const memberIds: { id: number; isLeader: boolean }[] = []
      
      for (const member of team.members) {
        if (!member.email) {
          console.log(`    ⚠️  Skipping participant "${member.name}" - no email provided`)
          continue
        }

        // Check if participant already exists by email
        const existingParticipant = await db
          .select()
          .from(participants)
          .where(eq(participants.email, member.email))
          .limit(1)

        let participantId: number

        if (existingParticipant.length > 0) {
          participantId = existingParticipant[0].id
          console.log(`    ⏭️  Participant "${member.name}" already exists`)
        } else {
          // Create participant
          const [newParticipant] = await db
            .insert(participants)
            .values({
              name: member.name,
              email: member.email,
              institude: team.institute || "Unknown",
              phoneNumber: member.phone || "N/A",
            })
            .$returningId()

          participantId = newParticipant.id
          participantsCreated++
          console.log(`    ✅ Created participant: "${member.name}"`)
        }

        memberIds.push({ id: participantId, isLeader: member.isLeader })
      }

      // Find leader ID (first member with isLeader = true)
      const leader = memberIds.find(m => m.isLeader)
      if (!leader) {
        console.log(`  ⚠️  Skipping team "${team.teamName}" - no valid leader found`)
        continue
      }

      // Check if team already exists by teamName
      const existingTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.teamName, team.teamName))
        .limit(1)

      let teamId: number

      if (existingTeam.length > 0) {
        teamId = existingTeam[0].id
        console.log(`  ⏭️  Team "${team.teamName}" already exists, skipping creation`)
      } else {
        // Create team with leader
        const [newTeam] = await db
          .insert(teams)
          .values({
            teamName: team.teamName,
            leaderId: leader.id,
          })
          .$returningId()

        teamId = newTeam.id
        teamsCreated++
        console.log(`  ✅ Created team: "${team.teamName}" (${team.projectId})`)
      }

      // Create team member links (excluding leader as they are already the leaderId)
      for (const member of memberIds) {
        // Check if team-member link exists
        const existingLink = await db
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, teamId),
              eq(teamMembers.memberId, member.id)
            )
          )
          .limit(1)

        if (existingLink.length === 0) {
          // Create team-member link
          await db.insert(teamMembers).values({
            teamId,
            memberId: member.id,
          })
          teamMembersLinked++
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing team "${team.teamName}":`, error)
    }
  }

  console.log("\n📊 Seeding Summary:")
  console.log(`  - Teams created: ${teamsCreated}`)
  console.log(`  - Participants created: ${participantsCreated}`)
  console.log(`  - Team-Member links created: ${teamMembersLinked}`)
  console.log("\n✅ Seeding completed!")
}

// Run the seeding
seedTeamsAndParticipants()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  })
