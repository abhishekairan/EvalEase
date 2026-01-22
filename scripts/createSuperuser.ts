import 'dotenv/config';
import * as readline from 'readline';
import { db } from '../src/db';
import { admin, creds } from '../src/db/schema';
import { hashPassword } from '../src/lib/password';
import { eq } from 'drizzle-orm';

/**
 * Interactive CLI script to create a superuser/admin
 * Usage: npx tsx scripts/createSuperuser.ts
 * 
 * Or with arguments:
 * npx tsx scripts/createSuperuser.ts --name "Admin Name" --email "admin@example.com" --password "securepassword"
 */

interface AdminInput {
  name: string;
  email: string;
  password: string;
}

// Create readline interface for interactive input
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Promisified question helper
function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Parse command line arguments
function parseArgs(): Partial<AdminInput> {
  const args: Partial<AdminInput> = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--name':
      case '-n':
        args.name = argv[++i];
        break;
      case '--email':
      case '-e':
        args.email = argv[++i];
        break;
      case '--password':
      case '-p':
        args.password = argv[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  return args;
}

function printHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              EvalEase - Create Superuser Script               ║
╚═══════════════════════════════════════════════════════════════╝

Usage: npx tsx scripts/createSuperuser.ts [options]

Options:
  -n, --name <name>         Admin's full name
  -e, --email <email>       Admin's email address
  -p, --password <password> Admin's password (min 8 characters)
  -h, --help                Show this help message

Examples:
  # Interactive mode (prompts for input):
  npx tsx scripts/createSuperuser.ts

  # With arguments:
  npx tsx scripts/createSuperuser.ts --name "John Doe" --email "admin@example.com" --password "secure123"

  # Short flags:
  npx tsx scripts/createSuperuser.ts -n "John Doe" -e "admin@example.com" -p "secure123"
`);
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
}

// Check if email already exists
async function emailExists(email: string): Promise<boolean> {
  const existing = await db.select().from(admin).where(eq(admin.email, email));
  return existing.length > 0;
}

// Create the admin in database
async function createSuperuser(input: AdminInput): Promise<void> {
  console.log('\n🔄 Creating superuser...');
  
  try {
    // Check if email already exists
    if (await emailExists(input.email)) {
      throw new Error(`An admin with email "${input.email}" already exists`);
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(input.password);
    
    // Create admin record
    const adminResult = await db.insert(admin).values({
      name: input.name,
      email: input.email,
    }).$returningId();
    
    if (!adminResult || adminResult.length === 0) {
      throw new Error('Failed to create admin record');
    }
    
    // Create credentials record
    await db.insert(creds).values({
      email: input.email,
      role: 'admin',
      password: hashedPassword,
    });
    
    console.log('\n✅ Superuser created successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`   Name:  ${input.name}`);
    console.log(`   Email: ${input.email}`);
    console.log(`   Role:  admin`);
    console.log('═══════════════════════════════════════');
    console.log('\n📝 You can now login with these credentials.\n');
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
    } else {
      console.error('\n❌ An unexpected error occurred');
    }
    process.exit(1);
  }
}

// Interactive mode - prompt for input
async function interactiveMode(prefilled: Partial<AdminInput>): Promise<AdminInput> {
  const rl = createReadlineInterface();
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              EvalEase - Create Superuser                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  let name = prefilled.name || '';
  let email = prefilled.email || '';
  let password = prefilled.password || '';
  
  // Get name
  if (!name) {
    name = await question(rl, '👤 Enter admin name: ');
    while (!name || name.length < 2) {
      console.log('   ⚠️  Name must be at least 2 characters');
      name = await question(rl, '👤 Enter admin name: ');
    }
  }
  
  // Get email
  if (!email) {
    email = await question(rl, '📧 Enter admin email: ');
    while (!isValidEmail(email)) {
      console.log('   ⚠️  Please enter a valid email address');
      email = await question(rl, '📧 Enter admin email: ');
    }
  } else if (!isValidEmail(email)) {
    console.log(`   ⚠️  Invalid email format: ${email}`);
    email = await question(rl, '📧 Enter admin email: ');
    while (!isValidEmail(email)) {
      console.log('   ⚠️  Please enter a valid email address');
      email = await question(rl, '📧 Enter admin email: ');
    }
  }
  
  // Get password
  if (!password) {
    password = await question(rl, '🔑 Enter password (min 8 chars): ');
    let validation = isValidPassword(password);
    while (!validation.valid) {
      console.log(`   ⚠️  ${validation.message}`);
      password = await question(rl, '🔑 Enter password (min 8 chars): ');
      validation = isValidPassword(password);
    }
  } else {
    const validation = isValidPassword(password);
    if (!validation.valid) {
      console.log(`   ⚠️  ${validation.message}`);
      password = await question(rl, '🔑 Enter password (min 8 chars): ');
      let newValidation = isValidPassword(password);
      while (!newValidation.valid) {
        console.log(`   ⚠️  ${newValidation.message}`);
        password = await question(rl, '🔑 Enter password (min 8 chars): ');
        newValidation = isValidPassword(password);
      }
    }
  }
  
  // Confirm details
  console.log('\n📋 Please confirm the details:');
  console.log('───────────────────────────────');
  console.log(`   Name:     ${name}`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${'*'.repeat(password.length)}`);
  console.log('───────────────────────────────');
  
  const confirm = await question(rl, '\n✓ Create this superuser? (y/N): ');
  
  rl.close();
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Operation cancelled.\n');
    process.exit(0);
  }
  
  return { name, email, password };
}

// Main function
async function main(): Promise<void> {
  try {
    const args = parseArgs();
    
    // If all arguments provided via CLI, skip interactive mode
    if (args.name && args.email && args.password) {
      // Validate inputs
      if (!isValidEmail(args.email)) {
        console.error('❌ Invalid email format');
        process.exit(1);
      }
      
      const passwordValidation = isValidPassword(args.password);
      if (!passwordValidation.valid) {
        console.error(`❌ ${passwordValidation.message}`);
        process.exit(1);
      }
      
      await createSuperuser(args as AdminInput);
    } else {
      // Interactive mode
      const input = await interactiveMode(args);
      await createSuperuser(input);
    }
    
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Fatal error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the script
main();
