import { generateDummyData, generateTestScenarios } from './dummyDataScript';

export async function runDummyData() {
  try {
    console.log('Starting dummy data generation process...\n');
    
    await generateDummyData({
      admins: 3,
      sessions: 2,
      juryPerSession: 3,
      participants: 30,
      teams: 10,
      membersPerTeam: 2,
      marksPerTeamPerJury: 1
    });

    console.log('\n🎉 All dummy data generation completed!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}
