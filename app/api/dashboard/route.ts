import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { machines, connectionSessions } from '@/db/schema';
import { eq, desc, isNull, count } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [totalResult, onlineResult, offlineResult, sessionsResult, recentSessions] = await Promise.all([
      db.select({ count: count() }).from(machines),
      db.select({ count: count() }).from(machines).where(eq(machines.status, 'online')),
      db.select({ count: count() }).from(machines).where(eq(machines.status, 'offline')),
      db.select({ count: count() }).from(connectionSessions).where(isNull(connectionSessions.endedAt)),
      db.select({
        id: connectionSessions.id,
        connectionName: connectionSessions.id,
        machineName: connectionSessions.id,
        userId: connectionSessions.userId,
        startedAt: connectionSessions.startedAt,
        duration: connectionSessions.duration,
      }).from(connectionSessions).orderBy(desc(connectionSessions.startedAt)).limit(10),
    ]);

    return NextResponse.json({
      data: {
        totalMachines: totalResult[0]?.count ?? 0,
        onlineCount: onlineResult[0]?.count ?? 0,
        offlineCount: offlineResult[0]?.count ?? 0,
        activeSessions: sessionsResult[0]?.count ?? 0,
        recentSessions,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
