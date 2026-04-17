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

  const result: NotificationItem[] = [];

  // ── Unread messages ────────────────────────────────────────────────────────
  const received = await prisma.message.findMany({
    where: { receiverIds: { has: payload.userId } },
    orderBy: { createdAt: 'desc' },
  });
  const unread = received.filter(m => !m.readByIds.includes(payload.userId));

  if (unread.length > 0) {
    const senderIds = [...new Set(unread.map(m => m.senderId))];
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true },
    });
    const senderMap = Object.fromEntries(senders.map(s => [s.id, s.name]));

    for (const msg of unread.slice(0, 6)) {
      result.push({
        id: msg.id,
        type: 'message',
        title: `Message from ${senderMap[msg.senderId] ?? 'Someone'}`,
        body: msg.messageText.length > 70
          ? msg.messageText.slice(0, 67) + '...'
          : msg.messageText,
        href: '/messages',
        messageType: msg.messageType,
        createdAt: msg.createdAt.toISOString(),
        messageIds: [msg.id],
      });
    }
  }

  // ── Pending maintenance (landlord only) ────────────────────────────────────
  if (payload.role === 'landlord') {
    const pending = await prisma.maintenanceRequest.findMany({
      where: { landlordId: payload.userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    if (pending.length > 0) {
      const tenantIds = [...new Set(pending.map(r => r.tenantId))];
      const tenants = await prisma.user.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, name: true },
      });
      const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t.name]));

      for (const req of pending) {
        result.push({
          id: req.id,
          type: 'maintenance',
          title: req.title,
          body: `${tenantMap[req.tenantId] ?? 'Tenant'} · ${req.priority} priority`,
          href: '/maintenance',
          priority: req.priority,
          createdAt: req.createdAt.toISOString(),
        });
      }
    }
  }

  // Sort newest first
  result.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ data: result });
}

interface NotificationItem {
  id: string;
  type: 'message' | 'maintenance';
  title: string;
  body: string;
  href: string;
  messageType?: string;
  priority?: string;
  createdAt: string;
  messageIds?: string[];
}
