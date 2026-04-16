import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MessageType } from '@/types';

function authenticate(req: NextRequest) {
  const token = getTokenFromCookieHeader(req.headers.get('cookie'));
  if (!token) return null;
  return verifyToken(token);
}

const VALID_TYPES: MessageType[] = ['urgent', 'warning', 'announcement', 'normal'];

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: payload.userId },
          { receiverIds: { has: payload.userId } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Batch-fetch all involved user names
    const userIds = new Set<string>();
    messages.forEach(m => {
      userIds.add(m.senderId);
      m.receiverIds.forEach(id => userIds.add(id));
    });

    const users = userIds.size
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, name: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

    const enriched = messages.map(m => ({
      ...m,
      senderName: userMap[m.senderId] ?? 'Unknown',
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('[GET /api/messages]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { receiverIds, messageText, messageType } = body;

    if (!messageText?.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }
    if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
      return NextResponse.json({ error: 'At least one receiver is required' }, { status: 400 });
    }

    const type: MessageType = VALID_TYPES.includes(messageType) ? messageType : 'normal';

    if (payload.role === 'tenant') {
      // Tenants may only message their landlord
      if (receiverIds.length !== 1) {
        return NextResponse.json({ error: 'Tenants can only send to one recipient' }, { status: 400 });
      }
      const property = await prisma.property.findFirst({
        where: {
          OR: [
            { tenantId: payload.userId },
            { units: { some: { tenantId: payload.userId } } },
          ],
        },
      });
      if (!property) {
        return NextResponse.json({ error: 'You are not assigned to any property' }, { status: 403 });
      }
      if (property.landlordId !== receiverIds[0]) {
        return NextResponse.json({ error: 'You can only message your landlord' }, { status: 403 });
      }
    } else if (payload.role === 'landlord') {
      // Landlords may only message their own tenants
      const tenants = await prisma.user.findMany({
        where: { id: { in: receiverIds }, role: 'tenant' },
        select: { id: true },
      });
      if (tenants.length !== receiverIds.length) {
        return NextResponse.json({ error: 'One or more recipients are invalid' }, { status: 400 });
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: payload.userId,
        receiverIds,
        messageText: messageText.trim(),
        messageType: type,
        readByIds: [payload.userId],
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true },
    });

    return NextResponse.json(
      {
        data: {
          ...message,
          senderName: sender?.name ?? 'Unknown',
          createdAt: message.createdAt.toISOString(),
        },
        message: 'Message sent',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/messages]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Mark messages as read for the current user
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { messageIds } = body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'messageIds array is required' }, { status: 400 });
    }

    // Update each message atomically — add userId to readByIds if not present
    await Promise.all(
      messageIds.map(async (id: string) => {
        const msg = await prisma.message.findFirst({
          where: {
            id,
            OR: [
              { senderId: payload.userId },
              { receiverIds: { has: payload.userId } },
            ],
          },
        });
        if (msg && !msg.readByIds.includes(payload.userId)) {
          await prisma.message.update({
            where: { id },
            data: { readByIds: { push: payload.userId } },
          });
        }
      })
    );

    return NextResponse.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('[PATCH /api/messages]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
