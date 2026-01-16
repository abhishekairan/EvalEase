# Database Connection Pool Fix

## Issue
`Error: Too many connections (ER_CON_COUNT_ERROR, errno: 1040)`

This error occurred because the MySQL connection pool was exhausted, preventing new database queries from executing.

## Root Cause
- Connection pool was configured with only **10 connections**
- During high load or concurrent requests, all connections were in use
- No retry logic for transient connection failures
- Poor error handling didn't provide useful feedback to users

## Solution Applied

### 1. Increased Connection Pool Size

**File:** `src/db/index.ts`

**Changes:**
- Increased `connectionLimit` from **10 to 50**
- Added `enableKeepAlive` to maintain connections
- Added proper cleanup handlers for graceful shutdown
- Exported pool status functions for monitoring

```typescript
connectionLimit: 50, // Increased from 10
maxIdle: 10,
idleTimeout: 60000,
enableKeepAlive: true,
```

### 2. Added Connection Pool Monitoring

**File:** `src/db/utils/dbHealth.ts` (NEW)

**Features:**
- `getPoolStatus()` - Monitor pool usage in real-time
- `isDatabaseHealthy()` - Check if pool is near capacity
- `waitForConnection()` - Wait for available connection
- `withRetry()` - Retry failed operations automatically

**Usage:**
```typescript
import { withRetry } from '@/db/utils/dbHealth';

const result = await withRetry(
  () => db.query.users.findMany(),
  3, // max retries
  1000 // delay between retries (ms)
);
```

### 3. Added Health Check Endpoint

**File:** `src/app/api/health/route.ts` (NEW)

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "pool": {
      "total": 50,
      "used": 5,
      "free": 45,
      "queued": 0,
      "usagePercent": "10%"
    }
  },
  "timestamp": "2026-01-16T14:30:00.000Z"
}
```

### 4. Improved Error Handling

**File:** `src/db/utils/juryUtils.ts`

**Changes:**
- Better error logging with error codes and context
- Throw meaningful errors for connection issues
- Distinguish between connection errors and other errors

**File:** `src/app/dashboard/jury/page.tsx`

**Changes:**
- Import and use `ErrorState` component
- Display user-friendly messages for connection errors
- Provide "Retry" and "Go Home" actions
- Differentiate connection errors from other errors

### 5. Graceful Shutdown

**File:** `src/db/index.ts`

**Added:**
- SIGINT handler - Closes pool on Ctrl+C
- SIGTERM handler - Closes pool on process termination
- Ensures connections are properly released

## Verification Steps

### 1. Restart the Development Server

```powershell
# Stop all node processes
Get-Process node | Stop-Process -Force

# Start fresh
npm run dev
```

### 2. Check Health Endpoint

Visit: `http://localhost:3000/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "pool": {
      "total": 50,
      "used": 1,
      "free": 49,
      ...
    }
  }
}
```

### 3. Monitor Pool Usage in Development

The pool status is automatically logged in development mode when you make database calls.

Look for:
```
📊 DB Pool Status: { total: 50, free: 48, queued: 0, used: 2 }
```

### 4. Test Error Recovery

1. Navigate to `/dashboard/jury`
2. If connection error occurs, you should see:
   - User-friendly error message
   - "Retry" button to reload
   - "Go Home" button to return to dashboard

## Best Practices Going Forward

### 1. Monitor Connection Usage

In production, set up monitoring for:
- Pool usage percentage (alert if > 80%)
- Queued connection requests (alert if > 0 consistently)
- Connection acquisition time
- Failed connection attempts

### 2. Adjust Pool Size Based on Load

**Formula:**
```
connectionLimit = (number of CPU cores × 2) + effective_spindle_count
```

For a 4-core system with SSD:
```
connectionLimit = (4 × 2) + 1 = 9 minimum
```

Current setting of 50 is safe for most scenarios.

### 3. Use Connection Retry Logic

For critical operations, wrap in retry logic:
```typescript
import { withRetry } from '@/db/utils/dbHealth';

const criticalData = await withRetry(
  () => getCriticalData(),
  5, // 5 retries
  2000 // 2 second delay
);
```

### 4. Implement Rate Limiting

Consider adding rate limiting for API endpoints that make database calls:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});
```

### 5. Regular Health Checks

Set up automated health checks:
```bash
# Cron job to check health every minute
* * * * * curl http://localhost:3000/api/health || echo "Health check failed"
```

## Environment Variables

Ensure these are set in `.env`:
```env
DATABASE_HOST=localhost
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
DATABASE_PORT=3306
```

## Troubleshooting

### If Error Persists After Fix

1. **Restart MySQL Server**
   ```bash
   # Windows
   net stop MySQL80
   net start MySQL80
   ```

2. **Check MySQL Max Connections**
   ```sql
   SHOW VARIABLES LIKE 'max_connections';
   ```
   
   Default is usually 151. If your app needs more:
   ```sql
   SET GLOBAL max_connections = 200;
   ```

3. **Check for Connection Leaks**
   ```powershell
   # Monitor active MySQL connections
   mysql -u root -p -e "SHOW PROCESSLIST;"
   ```

4. **Clear Connection Pool**
   ```powershell
   # Kill all node processes
   Get-Process node | Stop-Process -Force
   
   # Restart MySQL
   net stop MySQL80
   net start MySQL80
   
   # Start app fresh
   npm run dev
   ```

### If Pool Usage Stays High

1. Check for long-running queries:
   ```sql
   SHOW FULL PROCESSLIST;
   ```

2. Look for queries in "Sleep" state
3. Check for missing indexes causing slow queries
4. Consider query optimization

## Performance Improvements

### 1. Connection Reuse
✅ Already implemented via connection pooling

### 2. Query Optimization
- Use indexes on frequently queried columns
- Limit result sets with pagination
- Use select() to fetch only needed columns

### 3. Caching
Consider adding Redis for:
- Session data
- Frequently accessed data
- Rate limiting counters

## Files Modified

1. ✅ `src/db/index.ts` - Connection pool configuration
2. ✅ `src/db/utils/dbHealth.ts` - Health monitoring (NEW)
3. ✅ `src/db/utils/juryUtils.ts` - Error handling
4. ✅ `src/app/dashboard/jury/page.tsx` - Error display
5. ✅ `src/app/api/health/route.ts` - Health endpoint (NEW)

## Next Steps

1. **Restart your development server** to apply changes
2. **Test the dashboard** at `/dashboard/jury`
3. **Check health endpoint** at `/api/health`
4. **Monitor pool usage** in development console
5. **Report any remaining issues** if they occur

## Additional Resources

- [MySQL Connection Pool Docs](https://github.com/mysqljs/mysql#pooling-connections)
- [Drizzle ORM Best Practices](https://orm.drizzle.team/docs/performance)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
