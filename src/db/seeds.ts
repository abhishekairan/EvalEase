import { 
  insertUser, 
  insertTeam, 
  insertTeamMember, 
  insertMark 
} from "@/db/utils";
import { UserDBType, TeamDBType, TeamMemberDBType, MarksDBType } from "@/zod";
import { testConnection } from ".";

async function populateDatabase() {

    const testconnection  = await testConnection()
    if(!testconnection) return

  console.log("🚀 Starting database population...");

  try {
    // Step 1: Create Admin Users
    console.log("📝 Creating admin users...");
    const admin1 = await insertUser({
      name: "Dr. Sarah Johnson",
      email: "admin@paruluniversity.ac.in",
      phoneNumber: "+91-9876543210",
      role: "admin"
    } as UserDBType);

    const admin2 = await insertUser({
      name: "Prof. Rajesh Kumar",
      email: "rajesh.admin@paruluniversity.ac.in",
      phoneNumber: "+91-9876543211",
      role: "admin"
    } as UserDBType);

    // Step 2: Create Jury Members
    console.log("👨‍⚖️ Creating jury members...");
    const juryMembers = [];
    
    const juryData = [
      { name: "Dr. Priya Sharma", email: "priya.jury@paruluniversity.ac.in", phone: "+91-9876543220" },
      { name: "Mr. Amit Patel", email: "amit.jury@paruluniversity.ac.in", phone: "+91-9876543221" },
      { name: "Dr. Neha Gupta", email: "neha.jury@paruluniversity.ac.in", phone: "+91-9876543222" },
      { name: "Prof. Vikram Singh", email: "vikram.jury@paruluniversity.ac.in", phone: "+91-9876543223" },
      { name: "Dr. Anita Desai", email: "anita.jury@paruluniversity.ac.in", phone: "+91-9876543224" }
    ];

    for (const jury of juryData) {
      const juryMember = await insertUser({
        name: jury.name,
        email: jury.email,
        phoneNumber: jury.phone,
        role: "jury"
      } as UserDBType);
      juryMembers.push(juryMember[0]);
    }

    // Step 3: Create Student Users
    console.log("👨‍🎓 Creating student users...");
    const students = [];
    
    const studentData = [
      // Team 1 - AI Vision
      { name: "Arjun Mehta", email: "arjun.mehta@student.parul.ac.in", phone: "+91-8765432100" },
      { name: "Kavya Sharma", email: "kavya.sharma@student.parul.ac.in", phone: "+91-8765432101" },
      { name: "Rohit Verma", email: "rohit.verma@student.parul.ac.in", phone: "+91-8765432102" },
      { name: "Sneha Patel", email: "sneha.patel@student.parul.ac.in", phone: "+91-8765432103" },
      
      // Team 2 - ML Innovators
      { name: "Karan Singh", email: "karan.singh@student.parul.ac.in", phone: "+91-8765432104" },
      { name: "Riya Joshi", email: "riya.joshi@student.parul.ac.in", phone: "+91-8765432105" },
      { name: "Aditya Kumar", email: "aditya.kumar@student.parul.ac.in", phone: "+91-8765432106" },
      
      // Team 3 - Data Wizards
      { name: "Priyanka Agarwal", email: "priyanka.agarwal@student.parul.ac.in", phone: "+91-8765432107" },
      { name: "Harsh Gupta", email: "harsh.gupta@student.parul.ac.in", phone: "+91-8765432108" },
      { name: "Nisha Reddy", email: "nisha.reddy@student.parul.ac.in", phone: "+91-8765432109" },
      { name: "Varun Malhotra", email: "varun.malhotra@student.parul.ac.in", phone: "+91-8765432110" },
      
      // Team 4 - Tech Titans
      { name: "Ishita Bansal", email: "ishita.bansal@student.parul.ac.in", phone: "+91-8765432111" },
      { name: "Siddharth Jain", email: "siddharth.jain@student.parul.ac.in", phone: "+91-8765432112" },
      { name: "Ananya Rao", email: "ananya.rao@student.parul.ac.in", phone: "+91-8765432113" },
      
      // Team 5 - Neural Networks
      { name: "Rahul Chopra", email: "rahul.chopra@student.parul.ac.in", phone: "+91-8765432114" },
      { name: "Pooja Mishra", email: "pooja.mishra@student.parul.ac.in", phone: "+91-8765432115" },
      { name: "Deepak Sharma", email: "deepak.sharma@student.parul.ac.in", phone: "+91-8765432116" }
    ];

    for (const student of studentData) {
      const studentUser = await insertUser({
        name: student.name,
        email: student.email,
        phoneNumber: student.phone,
        role: "student"
      } as UserDBType);
      students.push(studentUser[0]);
    }

    // Step 4: Create Teams
    console.log("👥 Creating teams...");
    const teams = [];
    
    const teamData = [
      { name: "AI Vision", leaderId: students[0].id }, // Arjun Mehta
      { name: "ML Innovators", leaderId: students[4].id }, // Karan Singh
      { name: "Data Wizards", leaderId: students[7].id }, // Priyanka Agarwal
      { name: "Tech Titans", leaderId: students[11].id }, // Ishita Bansal
      { name: "Neural Networks", leaderId: students[14].id } // Rahul Chopra
    ];

    for (const team of teamData) {
      const newTeam = await insertTeam({
        teamName: team.name,
        leaderId: team.leaderId
      } as TeamDBType);
      teams.push(newTeam[0]);
    }

    // Step 5: Add Team Members
    console.log("🤝 Adding team members...");
    
    const teamMemberAssignments = [
      // Team 1 - AI Vision (members: Kavya, Rohit, Sneha)
      { teamId: teams[0].id, memberId: students[1].id },
      { teamId: teams[0].id, memberId: students[2].id },
      { teamId: teams[0].id, memberId: students[3].id },
      
      // Team 2 - ML Innovators (members: Riya, Aditya)
      { teamId: teams[1].id, memberId: students[5].id },
      { teamId: teams[1].id, memberId: students[6].id },
      
      // Team 3 - Data Wizards (members: Harsh, Nisha, Varun)
      { teamId: teams[2].id, memberId: students[8].id },
      { teamId: teams[2].id, memberId: students[9].id },
      { teamId: teams[2].id, memberId: students[10].id },
      
      // Team 4 - Tech Titans (members: Siddharth, Ananya)
      { teamId: teams[3].id, memberId: students[12].id },
      { teamId: teams[3].id, memberId: students[13].id },
      
      // Team 5 - Neural Networks (members: Pooja, Deepak)
      { teamId: teams[4].id, memberId: students[15].id },
      { teamId: teams[4].id, memberId: students[16].id }
    ];

    for (const assignment of teamMemberAssignments) {
      await insertTeamMember({
        teamId: assignment.teamId,
        memberId: assignment.memberId
      } as TeamMemberDBType);
    }

    // Step 6: Create Sample Marks (some submitted, some drafts)
    console.log("📊 Creating sample evaluation marks...");
    
    // Generate realistic marks for each team from each jury member
    for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
      for (let juryIndex = 0; juryIndex < juryMembers.length; juryIndex++) {
        const isSubmitted = Math.random() > 0.3; // 70% chance of being submitted
        
        // Generate realistic scores (6-10 range with some variation)
        const baseScore = 7 + Math.random() * 2; // Base score between 7-9
        const variation = () => Math.max(1, Math.min(10, Math.round(baseScore + (Math.random() - 0.5) * 2)));
        
        await insertMark({
          teamId: teams[teamIndex].id,
          juryId: juryMembers[juryIndex].id,
          innovationScore: variation(),
          presentationScore: variation(),
          technicalScore: variation(),
          impactScore: variation(),
          submitted: isSubmitted
        } as MarksDBType);
      }
    }

    console.log("✅ Database population completed successfully!");
    console.log(`📈 Summary:`);
    console.log(`   - ${2} Admin users created`);
    console.log(`   - ${juryMembers.length} Jury members created`);
    console.log(`   - ${students.length} Student users created`);
    console.log(`   - ${teams.length} Teams created`);
    console.log(`   - ${teamMemberAssignments.length} Team member assignments`);
    console.log(`   - ${teams.length * juryMembers.length} Evaluation records created`);

  } catch (error) {
    console.error("❌ Error populating database:", error);
    throw error;
  }
}

// Execute the script
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log("🎉 Database population script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { populateDatabase };
