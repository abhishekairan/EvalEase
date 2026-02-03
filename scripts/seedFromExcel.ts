import 'dotenv/config';
import * as XLSX from 'xlsx';
import path from 'path';
import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { createAdmin } from '../src/db/utils/adminUtils';
import { createJury } from '../src/db/utils/juryUtils';

// Types for Excel data
interface TeamRow {
  newTeamId: string;
  oldTeamId: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  member1Name: string | null;
  member2Name: string | null;
  member3Name: string | null;
  track: string;
}

interface JuryRow {
  srNo: number;
  name: string;
  email: string;
}

interface SeedOptions {
  clearExisting?: boolean;
  createAdmin?: boolean;
  createSession?: boolean;
  sessionName?: string;
  teamIdPrefix?: string;
  defaultRoom?: string;
  teamsPerRoom?: number;
}

/**
 * Read teams data from Excel file
 */
function readTeamsFromExcel(filePath: string): TeamRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  
  // Skip header row
  const dataRows = rawData.slice(1);
  
  return dataRows
    .filter((row) => row[0] && row[2] && row[3] && row[4]) // Filter rows with required fields
    .map((row) => ({
      newTeamId: String(row[0] || ''),
      oldTeamId: String(row[1] || ''),
      teamName: String(row[2] || ''),
      leaderName: String(row[3] || '').trim(),
      leaderEmail: String(row[4] || '').toLowerCase().trim(),
      member1Name: row[5] ? String(row[5]).trim() : null,
      member2Name: row[6] ? String(row[6]).trim() : null,
      member3Name: row[7] ? String(row[7]).trim() : null,
      track: String(row[8] || 'General'),
    }));
}

/**
 * Read jury data from Excel file
 */
function readJuryFromExcel(filePath: string): JuryRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });
  
  // Skip header row
  const dataRows = rawData.slice(1);
  
  return dataRows
    .filter((row) => row[1] && row[2]) // Filter rows with name and email
    .map((row) => ({
      srNo: Number(row[0]) || 0,
      name: String(row[1] || '').trim(),
      email: String(row[2] || '').toLowerCase().trim(),
    }));
}

/**
 * Generate a phone number placeholder (since Excel doesn't have phone numbers)
 */
function generatePhoneNumber(index: number): string {
  return `9${String(1000000000 + index).slice(1)}`;
}

/**
 * Seed the database with data from Excel files
 */
async function seedFromExcel(options: SeedOptions = {}) {
  const {
    clearExisting = true,
    createAdmin: shouldCreateAdmin = true,
    createSession: shouldCreateSession = true,
    sessionName = 'Hackathon Evaluation Session',
    teamIdPrefix = 'TE_',
    defaultRoom = 'Room',
    teamsPerRoom = 20,
  } = options;

  console.log('🌱 Starting database seeding from Excel files...\n');

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const teamsFilePath = path.join(dataDir, 'Stall Allotment Tech Expo 2026.xlsx');
    const juryFilePath = path.join(dataDir, 'ALL JURY MEMBERS.xlsx');

    // Read Excel files
    console.log('📖 Reading Excel files...');
    const teamsData = readTeamsFromExcel(teamsFilePath);
    const juryData = readJuryFromExcel(juryFilePath);
    console.log(`   - Found ${teamsData.length} teams`);
    console.log(`   - Found ${juryData.length} jury members\n`);

    if (clearExisting) {
      // Clear existing data (in reverse order of dependencies)
      console.log('🗑️  Clearing existing data...');
      await db.delete(schema.marks);
      await db.delete(schema.teamMembers);
      await db.delete(schema.teams);
      await db.delete(schema.jurySessions);
      await db.delete(schema.creds);
      await db.delete(schema.participants);
      await db.delete(schema.jury);
      await db.delete(schema.admin);
      await db.delete(schema.sessions);
      console.log('✓ Existing data cleared\n');
    }

    // 1. Create Admin (optional)
    let adminId: number | null = null;
    if (shouldCreateAdmin) {
      console.log('👤 Creating admin user...');
      const [newAdmin] = await createAdmin({
        admin: { 
          name: 'Admin User', 
          email: 'admin@evalease.com' 
        },
        password: 'admin1234',
      });
      
      if (newAdmin?.id) {
        adminId = newAdmin.id;
        console.log(`✓ Created admin: admin@evalease.com (password: admin1234)\n`);
      }
    }

    // 2. Create Session (optional)
    let sessionId: number | null = null;
    if (shouldCreateSession) {
      console.log('📅 Creating evaluation session...');
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setHours(currentDate.getHours() + 8);

      const [session] = await db.insert(schema.sessions).values({
        name: sessionName,
        startedAt: currentDate,
        endedAt: endDate,
      }).$returningId();
      
      sessionId = session.id;
      console.log(`✓ Created session: "${sessionName}"\n`);
    }

    // 3. Create Jury Members
    console.log(`👨‍⚖️ Creating ${juryData.length} jury members...`);
    const juryIds: number[] = [];
    const juryEmailToId: Map<string, number> = new Map();
    
    for (let i = 0; i < juryData.length; i++) {
      const juryRow = juryData[i];
      
      try {
        const [newJury] = await createJury({
          jury: {
            name: juryRow.name,
            email: juryRow.email,
            phoneNumber: generatePhoneNumber(i),
            role: 'jury',
          },
          password: 'jury1234',
        });
        
        if (newJury?.id) {
          juryIds.push(newJury.id);
          juryEmailToId.set(juryRow.email, newJury.id);
        }
      } catch (error) {
        console.warn(`   ⚠️ Skipping duplicate jury: ${juryRow.email}`);
      }
    }
    console.log(`✓ Created ${juryIds.length} jury members (password: jury1234)\n`);

    // 4. Assign Juries to Session
    if (sessionId && juryIds.length > 0) {
      console.log('🔗 Assigning juries to session...');
      const jurySessionData = juryIds.map(juryId => ({
        juryId,
        sessionId: sessionId as number,
      }));
      await db.insert(schema.jurySessions).values(jurySessionData);
      console.log(`✓ Assigned ${juryIds.length} juries to session\n`);
    }

    // 5. Create Participants (Team Leaders and Members)
    console.log(`👥 Creating participants from team data...`);
    const participantEmailToId: Map<string, number> = new Map();
    const participantsToInsert: { 
      name: string; 
      email: string; 
      institude: string; 
      phoneNumber: string; 
    }[] = [];
    
    // Collect unique participants from teams
    let participantIndex = 0;
    for (const team of teamsData) {
      // Add team leader
      if (!participantEmailToId.has(team.leaderEmail)) {
        participantsToInsert.push({
          name: team.leaderName,
          email: team.leaderEmail,
          institude: team.track, // Using track as institution
          phoneNumber: generatePhoneNumber(10000 + participantIndex++),
        });
        participantEmailToId.set(team.leaderEmail, -1); // Placeholder, will update after insert
      }
      
      // Add team members (they don't have emails in the Excel, so we generate them)
      const memberNames = [team.member1Name, team.member2Name, team.member3Name].filter(Boolean);
      for (const memberName of memberNames) {
        if (memberName && memberName !== team.leaderName) {
          // Generate a unique email for members without email
          const memberEmail = `${memberName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${participantIndex}@participant.local`;
          if (!participantEmailToId.has(memberEmail)) {
            participantsToInsert.push({
              name: memberName,
              email: memberEmail,
              institude: team.track,
              phoneNumber: generatePhoneNumber(10000 + participantIndex++),
            });
            participantEmailToId.set(memberEmail, -1);
          }
        }
      }
    }

    // Batch insert participants
    if (participantsToInsert.length > 0) {
      // Insert in batches to avoid query size limits
      const batchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < participantsToInsert.length; i += batchSize) {
        const batch = participantsToInsert.slice(i, i + batchSize);
        const inserted = await db.insert(schema.participants).values(batch).$returningId();
        
        // Update the email to ID mapping
        for (let j = 0; j < batch.length; j++) {
          participantEmailToId.set(batch[j].email, inserted[j].id);
        }
        insertedCount += inserted.length;
      }
      console.log(`✓ Created ${insertedCount} participants\n`);
    }

    // 6. Create Teams
    console.log(`🏆 Creating ${teamsData.length} teams...`);
    const teamIdMapping: Map<string, number> = new Map();
    const teamsToInsert: {
      teamName: string;
      leaderId: number;
      juryId: number | null;
      room: string | null;
    }[] = [];
    
    // Distribute teams among juries (round-robin)
    for (let i = 0; i < teamsData.length; i++) {
      const team = teamsData[i];
      const leaderId = participantEmailToId.get(team.leaderEmail);
      
      if (!leaderId || leaderId === -1) {
        console.warn(`   ⚠️ Skipping team "${team.teamName}" - leader not found`);
        continue;
      }
      
      // Assign jury round-robin
      const juryId = juryIds.length > 0 ? juryIds[i % juryIds.length] : null;
      
      teamsToInsert.push({
        teamName: team.teamName,
        leaderId,
        juryId,
        room: `${defaultRoom} ${Math.floor(i / teamsPerRoom) + 1}`, // Assign rooms based on teamsPerRoom
      });
    }

    // Batch insert teams
    if (teamsToInsert.length > 0) {
      const batchSize = 100;
      let teamIndex = 0;
      
      for (let i = 0; i < teamsToInsert.length; i += batchSize) {
        const batch = teamsToInsert.slice(i, i + batchSize);
        const inserted = await db.insert(schema.teams).values(batch).$returningId();
        
        // Update the team ID mapping
        for (let j = 0; j < batch.length; j++) {
          teamIdMapping.set(teamsData[teamIndex + j].newTeamId, inserted[j].id);
        }
        teamIndex += batch.length;
      }
      console.log(`✓ Created ${teamsToInsert.length} teams\n`);
    }

    // 7. Create Team Members
    console.log(`👫 Adding team members...`);
    const teamMembersToInsert: { teamId: number; memberId: number }[] = [];
    
    for (let i = 0; i < teamsData.length; i++) {
      const team = teamsData[i];
      const teamId = teamIdMapping.get(team.newTeamId);
      
      if (!teamId) continue;
      
      // Add leader as team member
      const leaderId = participantEmailToId.get(team.leaderEmail);
      if (leaderId && leaderId !== -1) {
        teamMembersToInsert.push({ teamId, memberId: leaderId });
      }
      
      // Add other members
      const memberNames = [team.member1Name, team.member2Name, team.member3Name].filter(Boolean);
      let memberSearchIndex = 0;
      for (const memberName of memberNames) {
        if (memberName && memberName !== team.leaderName) {
          // Find the member by reconstructed email
          const memberEmail = `${memberName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${10000 + participantsToInsert.findIndex(p => p.name === memberName && p.institude === team.track)}@participant.local`;
          
          // Search for the member in our participant list
          for (const [email, id] of participantEmailToId.entries()) {
            if (email.includes(memberName.toLowerCase().replace(/[^a-z0-9]/g, '.')) && id !== -1) {
              // Check if this member is not already added to this team
              const alreadyAdded = teamMembersToInsert.some(
                tm => tm.teamId === teamId && tm.memberId === id
              );
              if (!alreadyAdded) {
                teamMembersToInsert.push({ teamId, memberId: id });
                break;
              }
            }
          }
        }
      }
    }

    // Batch insert team members
    if (teamMembersToInsert.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < teamMembersToInsert.length; i += batchSize) {
        const batch = teamMembersToInsert.slice(i, i + batchSize);
        await db.insert(schema.teamMembers).values(batch);
      }
      console.log(`✓ Added ${teamMembersToInsert.length} team members\n`);
    }

    // Summary
    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Admin: ${shouldCreateAdmin ? 1 : 0}`);
    console.log(`   - Sessions: ${shouldCreateSession ? 1 : 0}`);
    console.log(`   - Jury Members: ${juryIds.length}`);
    console.log(`   - Participants: ${participantsToInsert.length}`);
    console.log(`   - Teams: ${teamsToInsert.length}`);
    console.log(`   - Team Members: ${teamMembersToInsert.length}`);
    console.log('\n🔑 Default credentials:');
    console.log('   - Admin: admin@evalease.com / admin1234');
    console.log('   - Jury: <jury-email> / jury1234');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: SeedOptions = {
  clearExisting: true,
  createAdmin: true,
  createSession: true,
  sessionName: 'Hackathon Evaluation Session',
  teamIdPrefix: 'HC_',
  defaultRoom: 'Room',
  teamsPerRoom: 20,
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--no-clear') {
    options.clearExisting = false;
  } else if (args[i] === '--no-admin') {
    options.createAdmin = false;
  } else if (args[i] === '--no-session') {
    options.createSession = false;
  } else if (args[i] === '--session-name' && args[i + 1]) {
    options.sessionName = args[++i];
  } else if (args[i] === '--team-prefix' && args[i + 1]) {
    options.teamIdPrefix = args[++i];
  } else if (args[i] === '--default-room' && args[i + 1]) {
    options.defaultRoom = args[++i];
  } else if (args[i] === '--teams-per-room' && args[i + 1]) {
    options.teamsPerRoom = parseInt(args[++i]) || 20;
  }
}

// Run seeding
seedFromExcel(options);
