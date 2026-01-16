import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Database connection configuration with improved pool settings
const poolConnection = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || '',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: 50, // Increased from 10 to handle more concurrent requests
  maxIdle: 10, // Maximum idle connections
  idleTimeout: 60000, // Close idle connections after 60 seconds
  queueLimit: 0, // Unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });

// Export pool for direct access if needed
export const pool = poolConnection;

// Helper function to test database connection
export async function testConnection() {
  try {
    console.log('Testing database connection...');
    await poolConnection.query('SELECT 1');
    console.log('Database connection successful!');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Helper function to get pool status
export async function getPoolStatus() {
  try {
    const connection = await poolConnection.getConnection();
    const status = {
      totalConnections: (poolConnection as any)._allConnections?.length || 0,
      freeConnections: (poolConnection as any)._freeConnections?.length || 0,
      queuedRequests: (poolConnection as any)._connectionQueue?.length || 0,
    };
    connection.release();
    return status;
  } catch (error) {
    console.error('Failed to get pool status:', error);
    return null;
  }
}

// Graceful shutdown handler
export async function closePool() {
  try {
    await poolConnection.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

// Handle process termination - only add listeners once
if (typeof window === 'undefined') {
  // Check if listeners already exist to prevent duplicates
  const hasListeners = process.listenerCount('SIGINT') > 0 || process.listenerCount('SIGTERM') > 0;
  
  if (!hasListeners) {
    process.setMaxListeners(15); // Increase limit to prevent warnings
    
    process.on('SIGINT', async () => {
      await closePool();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await closePool();
      process.exit(0);
    });
  }
}