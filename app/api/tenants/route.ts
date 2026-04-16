import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';

function authenticate(req: NextRequest) {
  const token = getTokenFromCookieHeader(req.headers.get('cookie'));
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (payload.role !== 'landlord') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tenants = await prisma.user.findMany({
      where: { role: 'tenant' },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: tenants });
  } catch (error) {
    console.error('[GET /api/tenants]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
