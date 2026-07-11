import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMachine, addMachineLog, updateMachine } from "@/lib/machines";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const machine = await getMachine(id);
  if (!machine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const startedAt = Date.now();

  try {
    const isWindows = process.platform === "win32";
    const pingCmd = isWindows
      ? `ping -n 1 -w 3000 ${machine.host}`
      : `ping -c 1 -W 3 ${machine.host}`;

    const { stdout } = await execAsync(pingCmd, { timeout: 5000 });

    const rttMatch = stdout.match(/time[=<](\d+\.?\d*)\s*ms/i);
    const rtt = rttMatch ? Math.round(parseFloat(rttMatch[1])) : Date.now() - startedAt;

    await updateMachine(id, {
      status: "online",
      lastSeen: new Date(),
      latency: rtt,
    });

    await addMachineLog(id, {
      level: "info",
      message: `Ping successful — ${rtt}ms`,
      source: "ping",
      metadata: { latency: rtt },
    });

    return NextResponse.json({
      data: { reachable: true, latency: rtt },
    });
  } catch {
    await updateMachine(id, {
      status: "offline",
    });

    await addMachineLog(id, {
      level: "warn",
      message: "Ping failed — host unreachable",
      source: "ping",
    });

    return NextResponse.json({
      data: { reachable: false, latency: 0 },
    });
  }
}
