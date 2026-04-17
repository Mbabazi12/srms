import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';

function authenticate(req: NextRequest) {
  const token = getTokenFromCookieHeader(req.headers.get('cookie'));
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const payload = authenticate(req);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const [receivedMessages, pendingMaintenance] = await Promise.all([
    prisma.message.findMany({
      where: { receiverIds: { has: payload.userId } },
      select: { readByIds: true },
    }),
    payload.role === 'landlord'
      ? prisma.maintenanceRequest.count({
          where: { landlordId: payload.userId, status: 'pending' },
        })
      : Promise.resolve(0),
  ]);

  const unreadMessages = receivedMessages.filter(
    m => !m.readByIds.includes(payload.userId)
  ).length;

  return NextResponse.json({ data: { unreadMessages, pendingMaintenance } });
}
