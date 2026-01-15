// scripts/runMigration.ts
import 'dotenv/config'
import { db } from '../src/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  try {
    console.log('Starting migration...')
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0003_vengeful_pretty_boy.sql')
    let migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Remove comments
    migrationSQL = migrationSQL.replace(/--[^\n]*\n/g, '\n')
    
    // Split by statement-breakpoint and then by semicolon
    const parts = migrationSQL.split('--> statement-breakpoint')
    const statements: string[] = []
    
    for (const part of parts) {
      const lines = part.trim().split(';').filter(s => s.trim().length > 0)
      statements.push(...lines.map(s => s.trim() + ';'))
    }
    
    console.log(`Found ${statements.length} statements to execute\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement || statement === ';') continue
      
      console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 80)}...`)
      
      try {
        await db.execute(sql.raw(statement))
        console.log('  ✓ Success\n')
      } catch (error: any) {
        console.error(`  ✗ Failed: ${error.message}\n`)
      }
    }
    
    console.log('✅ Migration completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
