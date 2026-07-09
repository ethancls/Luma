import { auth } from '@/lib/auth';
import { env } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return handleAuth(req);
}

export async function POST(req: NextRequest) {
  // Block registration if disabled
  if (!env.ENABLE_REGISTRATION && req.nextUrl.pathname === '/api/auth/sign-up/email') {
    return NextResponse.json({ message: 'Registration is disabled' }, { status: 403 });
  }
  return handleAuth(req);
}

export async function PUT(req: NextRequest) {
  return handleAuth(req);
}

export async function DELETE(req: NextRequest) {
  return handleAuth(req);
}

async function handleAuth(req: NextRequest) {
  return auth.handler(req);
}
