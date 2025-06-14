import { faker } from '@faker-js/faker';
import { 
  createAdmin, 
  createSession, 
  createJury, 
  createParticipant, 
  createTeam, 
  addTeamMember, 
  createMark 
} from '@/db/utils'; // Note the relative path

/**
 * Dummy Data Generation Script
 * 
 * This script generates realistic dummy data for all tables in the database
 * using the utility functions to ensure they work correctly.
 * It maintains proper foreign key relationships and realistic data patterns.
 */

interface DummyDataConfig {
  admins: number;
  sessions: number;
  juryPerSession: number;
  participants: number;
  teams: number;
  membersPerTeam: number;
  marksPerTeamPerJury: number;
}

const DEFAULT_CONFIG: DummyDataConfig = {
  admins: 5,
  sessions: 3,
  juryPerSession: 4,
  participants: 50,
  teams: 15,
  membersPerTeam: 3,
  marksPerTeamPerJury: 1
};

/**
 * Main function to generate all dummy data
 */
export async function generateDummyData(config: DummyDataConfig = DEFAULT_CONFIG) {
  console.log('🚀 Starting dummy data generation...');
  
  try {
    // Step 1: Create Admins
    console.log('👨‍💼 Creating admins...');
    const admins = await createDummyAdmins(config.admins);
    console.log(`✅ Created ${admins.length} admins`);

    // Step 2: Create Sessions
    console.log('📅 Creating sessions...');
    const sessions = await createDummySessions(config.sessions);
    console.log(`✅ Created ${sessions.length} sessions`);

    // Step 3: Create Participants
    console.log('👥 Creating participants...');
    const participants = await createDummyParticipants(config.participants);
    console.log(`✅ Created ${participants.length} participants`);

    // Step 4: Create Jury Members
    console.log('⚖️ Creating jury members...');
    const juryMembers = await createDummyJury(sessions, config.juryPerSession);
    console.log(`✅ Created ${juryMembers.length} jury members`);

    // Step 5: Create Teams
    console.log('🏆 Creating teams...');
    const teams = await createDummyTeams(participants, config.teams);
    console.log(`✅ Created ${teams.length} teams`);

    // Step 6: Add Team Members
    console.log('👫 Adding team members...');
    const teamMemberships = await createDummyTeamMembers(teams, participants, config.membersPerTeam);
    console.log(`✅ Created ${teamMemberships.length} team memberships`);

    // Step 7: Create Marks
    console.log('📊 Creating marks...');
    const marks = await createDummyMarks(teams, juryMembers, sessions);
    console.log(`✅ Created ${marks.length} marks`);

    console.log('🎉 Dummy data generation completed successfully!');
    
    return {
      admins,
      sessions,
      participants,
      juryMembers,
      teams,
      teamMemberships,
      marks
    };

  } catch (error) {
    console.error('❌ Error generating dummy data:', error);
    throw error;
  }
}

/**
 * Create dummy admin records
 */
async function createDummyAdmins(count: number) {
  const admins = [];
  
  for (let i = 0; i < count; i++) {
    const adminData = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase()
    };

    try {
      const result = await createAdmin({ admin: adminData });
      if (result.length > 0) {
        admins.push(result[0]);
        console.log(`  📝 Created admin: ${adminData.name} (${adminData.email})`);
      }
    } catch (error) {
        if(error instanceof Error){ 
            console.warn(`  ⚠️ Failed to create admin ${adminData.email}:`, error.message);}
        }
  }
  
  return admins;
}

/**
 * Create dummy session records
 */
async function createDummySessions(count: number) {
  const sessions = [];
  const sessionNames = [
    'Innovation Challenge 2025',
    'Tech Startup Pitch',
    'Digital Transformation Summit',
    'AI & Machine Learning Contest',
    'Sustainable Technology Fair',
    'Cybersecurity Hackathon'
  ];

  for (let i = 0; i < count; i++) {
    const startDate = faker.date.future({ years: 1 });
    const endDate = faker.date.future({ years: 1, refDate: startDate });
    
    const sessionData = {
      name: sessionNames[i % sessionNames.length] + ` - Session ${i + 1}`,
      startedAt: startDate,
      endedAt: endDate
    };

    try {
      const result = await createSession({ session: sessionData });
      if (result.length > 0) {
        sessions.push(result[0]);
        console.log(`  📅 Created session: ${sessionData.name}`);
      }
    } catch (error) {
        if(error instanceof Error)
      console.warn(`  ⚠️ Failed to create session ${sessionData.name}:`, error.message);
    }
  }
  
  return sessions;
}

/**
 * Create dummy participant records
 */
async function createDummyParticipants(count: number) {
  const participants = [];
  const institutes = [
    'MIT', 'Stanford University', 'Harvard University', 'UC Berkeley',
    'Carnegie Mellon University', 'Georgia Tech', 'University of Washington',
    'Princeton University', 'Yale University', 'Columbia University',
    'University of Chicago', 'Northwestern University', 'Duke University'
  ];

  for (let i = 0; i < count; i++) {
    const participantData = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      institude: faker.helpers.arrayElement(institutes),
      phoneNumber: faker.phone.number({ style: 'international' })
    };

    try {
      const result = await createParticipant({ participant: participantData });
      if (result.length > 0) {
        participants.push(result[0]);
        console.log(`  👤 Created participant: ${participantData.name} from ${participantData.institude}`);
      }
    } catch (error) {
        if(error instanceof Error)
      console.warn(`  ⚠️ Failed to create participant ${participantData.email}:`, error.message);
    }
  }
  
  return participants;
}

/**
 * Create dummy jury members
 */
async function createDummyJury(sessions: any[], juryPerSession: number) {
  const juryMembers = [];

  for (const session of sessions) {
    for (let i = 0; i < juryPerSession; i++) {
      const juryData = {
        name: `Dr. ${faker.person.fullName()}`,
        email: faker.internet.email().toLowerCase(),
        session: session.id,
        phoneNumber: faker.phone.number({ style: 'international' })
      };

      try {
        const result = await createJury({ jury: juryData });
        if (result.length > 0) {
          juryMembers.push(result[0]);
          console.log(`  ⚖️ Created jury member: ${juryData.name} for session ${session.name}`);
        }
      } catch (error) {
        if(error instanceof Error)
        console.warn(`  ⚠️ Failed to create jury member ${juryData.email}:`, error.message);
      }
    }
  }
  
  return juryMembers;
}

/**
 * Create dummy team records
 */
async function createDummyTeams(participants: any[], teamCount: number) {
  const teams = [];
  const teamNamePrefixes = [
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
    'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho',
    'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
  ];
  
  const teamNameSuffixes = [
    'Innovators', 'Pioneers', 'Creators', 'Builders', 'Makers', 'Visionaries',
    'Disruptors', 'Challengers', 'Warriors', 'Champions', 'Masters', 'Legends'
  ];

  // Shuffle participants to ensure random team leaders
  const shuffledParticipants = faker.helpers.shuffle([...participants]);
  
  for (let i = 0; i < Math.min(teamCount, shuffledParticipants.length); i++) {
    const teamData = {
      teamName: `${faker.helpers.arrayElement(teamNamePrefixes)} ${faker.helpers.arrayElement(teamNameSuffixes)}`,
      leaderId: shuffledParticipants[i].id
    };

    try {
      const result = await createTeam({ team: teamData });
      if (result.length > 0) {
        teams.push(result[0]);
        console.log(`  🏆 Created team: ${teamData.teamName} led by ${shuffledParticipants[i].name}`);
      }
    } catch (error) {
        if(error instanceof Error)
      console.warn(`  ⚠️ Failed to create team ${teamData.teamName}:`, error.message);
    }
  }
  
  return teams;
}

/**
 * Create dummy team member relationships
 */
async function createDummyTeamMembers(teams: any[], participants: any[], membersPerTeam: number) {
  const teamMemberships = [];
  
  // Get participants who are not team leaders
  const teamLeaderIds = teams.map(team => team.leaderId);
  const availableMembers = participants.filter(p => !teamLeaderIds.includes(p.id));
  
  let memberIndex = 0;
  
  for (const team of teams) {
    const teamMemberCount = Math.min(
      membersPerTeam, 
      availableMembers.length - memberIndex
    );
    
    for (let i = 0; i < teamMemberCount; i++) {
      if (memberIndex >= availableMembers.length) break;
      
      const memberData = {
        teamId: team.id,
        memberId: availableMembers[memberIndex].id
      };

      try {
        const result = await addTeamMember({ teamMember: memberData });
        if (result.length > 0) {
          teamMemberships.push(result[0]);
          console.log(`  👫 Added ${availableMembers[memberIndex].name} to team ${team.teamName}`);
        }
        memberIndex++;
      } catch (error) {
        if(error instanceof Error)
        console.warn(`  ⚠️ Failed to add member to team ${team.teamName}:`, error.message);
        memberIndex++;
      }
    }
  }
  
  return teamMemberships;
}

/**
 * Create dummy marks records
 */
async function createDummyMarks(teams: any[], juryMembers: any[], sessions: any[]) {
  const marks = [];

  for (const team of teams) {
    for (const jury of juryMembers) {
      // Create marks for each jury member's session
      const session = sessions.find(s => s.id === jury.session);
      if (!session) continue;

      const markData = {
        teamId: team.id,
        juryId: jury.id,
        session: session.id,
        innovationScore: faker.number.int({ min: 1, max: 10 }),
        presentationScore: faker.number.int({ min: 1, max: 10 }),
        technicalScore: faker.number.int({ min: 1, max: 10 }),
        impactScore: faker.number.int({ min: 1, max: 10 }),
        submitted: faker.datatype.boolean({ probability: 0.7 }) // 70% chance of being submitted
      };

      try {
        const result = await createMark({ mark: markData });
        if (result.length > 0) {
          marks.push(result[0]);
          const total = markData.innovationScore + markData.presentationScore + 
                       markData.technicalScore + markData.impactScore;
          console.log(`  📊 Created mark: Team ${team.teamName} by ${jury.name} - Total: ${total}/40`);
        }
      } catch (error) {
        if(error instanceof Error)
        console.warn(`  ⚠️ Failed to create mark for team ${team.teamName}:`, error.message);
      }
    }
  }
  
  return marks;
}

/**
 * Generate specific test scenarios
 */
export async function generateTestScenarios() {
  console.log('🧪 Generating specific test scenarios...');
  
  try {
    // Scenario 1: Complete workflow test
    console.log('📋 Scenario 1: Complete workflow test');
    
    // Create a session
    const testSession = await createSession({
      session: {
        name: 'Test Scenario Session',
        startedAt: new Date(),
        endedAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    });

    // Create jury for the session
    const testJury = await createJury({
      jury: {
        name: 'Test Judge',
        email: 'test.judge@example.com',
        session: testSession[0].id,
        phoneNumber: '+1234567890'
      }
    });

    // Create participants
    const testParticipants = [];
    for (let i = 0; i < 4; i++) {
      const participant = await createParticipant({
        participant: {
          name: `Test Participant ${i + 1}`,
          email: `test.participant${i + 1}@example.com`,
          institude: 'Test University',
          phoneNumber: `+123456789${i}`
        }
      });
      testParticipants.push(participant[0]);
    }

    // Create a team
    const testTeam = await createTeam({
      team: {
        teamName: 'Test Team Alpha',
        leaderId: testParticipants[0].id
      }
    });

    // Add team members
    for (let i = 1; i < testParticipants.length; i++) {
      await addTeamMember({
        teamMember: {
          teamId: testTeam[0].id,
          memberId: testParticipants[i].id
        }
      });
    }

    // Create marks
    const testMark = await createMark({
      mark: {
        teamId: testTeam[0].id,
        juryId: testJury[0].id,
        session: testSession[0].id,
        innovationScore: 8,
        presentationScore: 7,
        technicalScore: 9,
        impactScore: 8,
        submitted: true
      }
    });

    console.log('✅ Test scenario completed successfully!');
    
    return {
      session: testSession[0],
      jury: testJury[0],
      participants: testParticipants,
      team: testTeam[0],
      mark: testMark[0]
    };

  } catch (error) {
    console.error('❌ Error in test scenario:', error);
    throw error;
  }
}

/**
 * Clean up dummy data (optional utility)
 */
export async function cleanupDummyData() {
  console.log('🧹 Cleaning up dummy data...');
  // Implementation would depend on your specific cleanup requirements
  // This could involve calling delete functions from your utils
  console.log('⚠️ Cleanup function not implemented - implement based on your needs');
}

// Export the main function for easy usage
export default generateDummyData;
