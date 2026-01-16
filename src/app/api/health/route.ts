import { NextResponse } from 'next/server';
import { testConnection, getPoolStatus } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          message: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Get pool status
    const poolStatus = await getPoolStatus();
    
    // Calculate health metrics
    const totalConnections = poolStatus?.totalConnections || 0;
    const freeConnections = poolStatus?.freeConnections || 0;
    const usedConnections = totalConnections - freeConnections;
    const usagePercent = totalConnections > 0 
      ? Math.round((usedConnections / totalConnections) * 100) 
      : 0;

    const isHealthy = usagePercent < 90;

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      database: {
        connected: true,
        pool: {
          total: totalConnections,
          used: usedConnections,
          free: freeConnections,
          queued: poolStatus?.queuedRequests || 0,
          usagePercent: `${usagePercent}%`,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        message: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
