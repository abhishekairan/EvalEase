import { pool, getPoolStatus } from '@/db';

/**
 * Middleware to log database pool status
 * Useful for debugging connection issues
 */
export async function logPoolStatus() {
  if (process.env.NODE_ENV === 'development') {
    const status = await getPoolStatus();
    if (status) {
      console.log('📊 DB Pool Status:', {
        total: status.totalConnections,
        free: status.freeConnections,
        queued: status.queuedRequests,
        used: status.totalConnections - status.freeConnections,
      });
    }
  }
}

/**
 * Check if database is healthy
 * Returns true if connection pool is not exhausted
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const status = await getPoolStatus();
    if (!status) return false;
    
    // Consider unhealthy if more than 90% of connections are in use
    const usagePercent = ((status.totalConnections - status.freeConnections) / status.totalConnections) * 100;
    return usagePercent < 90;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Wait for a connection to become available
 * Use this in critical sections to ensure we don't overwhelm the pool
 */
export async function waitForConnection(timeoutMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const isHealthy = await isDatabaseHealthy();
    if (isHealthy) return true;
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

/**
 * Execute a database operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a connection error
      const isConnectionError = 
        error instanceof Error && 
        (error.message.includes('Too many connections') ||
         error.message.includes('Connection') ||
         (error as any).code === 'ER_CON_COUNT_ERROR');
      
      if (isConnectionError && attempt < maxRetries) {
        console.log(`🔄 Connection error, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}
