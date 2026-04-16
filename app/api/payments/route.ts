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

    const payments = await prisma.payment.findMany({
      where: payload.role === 'landlord' ? { landlordId: payload.userId } : { tenantId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    // Batch-fetch related properties for enrichment
    const propertyIds = [...new Set(payments.map(p => p.propertyId))];
    const properties = propertyIds.length
      ? await prisma.property.findMany({
          where: { id: { in: propertyIds } },
          select: { id: true, title: true, address: true },
        })
      : [];
    const propMap = Object.fromEntries(properties.map(p => [p.id, p]));

    const enriched = payments.map(p => ({
      ...p,
      date: p.date?.toISOString() ?? null,
      dueDate: p.dueDate.toISOString(),
      createdAt: p.createdAt.toISOString(),
      propertyTitle: propMap[p.propertyId]?.title,
      propertyAddress: propMap[p.propertyId]?.address,
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('[GET /api/payments]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
