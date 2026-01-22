import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { createAdmin } from '../src/db/utils/adminUtils';
import { createJury } from '../src/db/utils/juryUtils';

interface SeedOptions {
  admins?: number;
  juries?: number;
  participants?: number;
  sessions?: number;
  teams?: number;
  membersPerTeam?: number;
}

/**
 * Seed the database with mock data
 */
async function seed(options: SeedOptions = {}) {
  const {
    admins = 2,
    juries = 10,
    participants = 50,
    sessions = 3,
    teams = 15,
    membersPerTeam = 3,
  } = options;

  console.log('🌱 Starting database seeding...\n');

  try {
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

    // 1. Create Admins
    console.log(`👤 Creating ${admins} admins...`);
    const adminIds = [];
    for (let i = 0; i < admins; i++) {
      const name = faker.person.fullName();
      const email = `admin${i}@evalease.com`;
      
      // Use createAdmin utility which handles password hashing
      const [newAdmin] = await createAdmin({
        admin: { name, email },
        password: 'admin1234',
      });
      
      if (newAdmin?.id) {
        adminIds.push(newAdmin.id);
      }
    }
    console.log(`✓ Created ${adminIds.length} admins\n`);

    // 2. Create Sessions
    console.log(`📅 Creating ${sessions} sessions...`);
    const sessionData = [];
    const currentDate = new Date();
    for (let i = 0; i < sessions; i++) {
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() + i * 7); // Sessions one week apart
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 4); // 4 hours duration

      sessionData.push({
        name: `${faker.company.buzzPhrase()} Hackathon ${i + 1}`,
        startedAt: startDate,
        endedAt: endDate,
      });
    }
    const insertedSessions = await db.insert(schema.sessions).values(sessionData).$returningId();
    const sessionIds = insertedSessions.map(s => s.id);
    console.log(`✓ Created ${sessions} sessions\n`);

    // 3. Create Juries
    console.log(`👨‍⚖️ Creating ${juries} jury members...`);
    const juryIds = [];
    for (let i = 0; i < juries; i++) {
      const name = faker.person.fullName();
      const email = `jury${i}@evalease.com`;
      const phoneNumber = `9${faker.number.int({ min: 100000000, max: 999999999 })}`;
      
      // Use createJury utility which handles password hashing
      const [newJury] = await createJury({
        jury: {
          name,
          email,
          phoneNumber,
          role: 'jury',
        },
        password: 'jury1234',
      });
      
      if (newJury?.id) {
        juryIds.push(newJury.id);
      }
    }
    console.log(`✓ Created ${juryIds.length} jury members\n`);

    // 4. Assign Juries to Sessions (each jury assigned to 1-2 sessions)
    console.log('🔗 Assigning juries to sessions...');
    const jurySessionData = [];
    for (const juryId of juryIds) {
      const numSessions = faker.number.int({ min: 1, max: 2 });
      const assignedSessions = faker.helpers.arrayElements(sessionIds, numSessions);
      for (const sessionId of assignedSessions) {
        jurySessionData.push({
          juryId,
          sessionId,
        });
      }
    }
    await db.insert(schema.jurySessions).values(jurySessionData);
    console.log(`✓ Assigned juries to sessions\n`);

    // 5. Create Participants
    console.log(`👥 Creating ${participants} participants...`);
    const participantData = [];
    const institutions = [
      'MIT',
      'Stanford University',
      'Harvard University',
      'UC Berkeley',
      'Oxford University',
      'Cambridge University',
      'ETH Zurich',
      'National University of Singapore',
      'University of Toronto',
      'Carnegie Mellon University',
    ];
    
    for (let i = 0; i < participants; i++) {
      participantData.push({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        institude: faker.helpers.arrayElement(institutions),
        phoneNumber: `9${faker.number.int({ min: 100000000, max: 999999999 })}`,
      });
    }
    const insertedParticipants = await db.insert(schema.participants).values(participantData).$returningId();
    const participantIds = insertedParticipants.map(p => p.id);
    console.log(`✓ Created ${participants} participants\n`);

    // 6. Create Teams
    console.log(`🏆 Creating ${teams} teams...`);
    const teamData = [];
    const rooms = ['Room A', 'Room B', 'Room C', 'Room D', 'Room E', 'Lab 1', 'Lab 2', 'Hall 101', 'Hall 102'];
    const usedLeaders = new Set<number>();
    
    for (let i = 0; i < teams; i++) {
      // Select a unique leader
      let leaderId;
      do {
        leaderId = faker.helpers.arrayElement(participantIds);
      } while (usedLeaders.has(leaderId));
      usedLeaders.add(leaderId);

      const juryId = faker.helpers.arrayElement(juryIds);
      
      teamData.push({
        teamName: `${faker.company.buzzAdjective()} ${faker.hacker.noun()}`.replace(/^./, (str) => str.toUpperCase()),
        leaderId,
        juryId,
        room: faker.helpers.arrayElement(rooms),
      });
    }
    const insertedTeams = await db.insert(schema.teams).values(teamData).$returningId();
    const teamIds = insertedTeams.map(t => t.id);
    console.log(`✓ Created ${teams} teams\n`);

    // 7. Create Team Members
    console.log(`👫 Adding team members...`);
    const teamMemberData = [];
    const usedParticipants = new Set(Array.from(usedLeaders)); // Leaders are already in teams

    for (let i = 0; i < teamIds.length; i++) {
      const teamId = teamIds[i];
      const team = teamData[i];
      
      // Add leader as team member
      teamMemberData.push({
        teamId,
        memberId: team.leaderId,
      });

      // Add additional members
      const additionalMembers = Math.min(membersPerTeam - 1, participants - usedParticipants.size);
      let addedMembers = 0;
      
      while (addedMembers < additionalMembers) {
        const memberId = faker.helpers.arrayElement(participantIds);
        if (!usedParticipants.has(memberId)) {
          usedParticipants.add(memberId);
          teamMemberData.push({
            teamId,
            memberId,
          });
          addedMembers++;
        }
      }
    }
    await db.insert(schema.teamMembers).values(teamMemberData);
    console.log(`✓ Added ${teamMemberData.length} team members\n`);

    // 8. Create Marks (some submitted, some not)
    console.log('📝 Creating evaluation marks...');
    const marksData = [];
    
    for (const sessionId of sessionIds) {
      // Get juries assigned to this session
      const sessionJuries = jurySessionData
        .filter(js => js.sessionId === sessionId)
        .map(js => js.juryId);

      // Each team should be evaluated by each jury in the session
      for (let i = 0; i < teamIds.length; i++) {
        const teamId = teamIds[i];
        const team = teamData[i];
        
        // Only create marks if team's jury is assigned to this session
        if (sessionJuries.includes(team.juryId)) {
          const isSubmitted = faker.datatype.boolean({ probability: 0.7 }); // 70% submitted
          const isLocked = isSubmitted && faker.datatype.boolean({ probability: 0.5 }); // 50% of submitted are locked
          
          marksData.push({
            teamId,
            juryId: team.juryId,
            session: sessionId,
            feasibilityScore: isSubmitted ? faker.number.int({ min: 15, max: 25 }) : 0,
            techImplementationScore: isSubmitted ? faker.number.int({ min: 15, max: 25 }) : 0,
            innovationCreativityScore: isSubmitted ? faker.number.int({ min: 15, max: 25 }) : 0,
            problemRelevanceScore: isSubmitted ? faker.number.int({ min: 15, max: 25 }) : 0,
            submitted: isSubmitted,
            locked: isLocked,
          });
        }
      }
    }
    
    if (marksData.length > 0) {
      await db.insert(schema.marks).values(marksData);
      console.log(`✓ Created ${marksData.length} evaluation marks\n`);
    }

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Admins: ${admins}`);
    console.log(`   - Juries: ${juries}`);
    console.log(`   - Participants: ${participants}`);
    console.log(`   - Sessions: ${sessions}`);
    console.log(`   - Teams: ${teams}`);
    console.log(`   - Team Members: ${teamMemberData.length}`);
    console.log(`   - Marks: ${marksData.length}`);
    console.log('\n🔑 Default passwords:');
    console.log('   - Admins: admin123');
    console.log('   - Juries: jury123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: SeedOptions = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '') as keyof SeedOptions;
  const value = parseInt(args[i + 1]);
  if (!isNaN(value)) {
    options[key] = value;
  }
}

// Run seeding
seed(options);
