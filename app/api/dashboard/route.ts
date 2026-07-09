import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServices } from '@/lib/services';
import { getMachines } from '@/lib/machines';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { services, total: totalServices } = await getServices({ limit: 1 });
    const { services: onlineList, total: onlineCount } = await getServices({ status: 'online', limit: 1 });
    const { services: offlineList, total: offlineCount } = await getServices({ status: 'offline', limit: 1 });
    const { machines, total: totalMachines } = await getMachines({ limit: 1 });

    // Get all services to filter TLS expiry within 30 days
    const { services: allServices } = await getServices({ limit: 1000 });
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const tlsExpiringServices = allServices
      .filter((s) => s.tlsExpiry != null && s.tlsExpiry < new Date(now + thirtyDays))
      .map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        tlsExpiry: s.tlsExpiry,
      }));

    const offlineServiceRows = offlineList.slice(0, 5);

    return NextResponse.json({
      data: {
        totalServices,
        onlineCount,
        offlineCount,
        totalMachines,
        offlineServices: offlineServiceRows,
        // TODO: global recent checks/logs query
        recentChecks: [],
        recentLogs: [],
        tlsExpiring: tlsExpiringServices,
      },
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
