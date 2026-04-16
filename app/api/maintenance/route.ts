import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MaintenancePriority } from '@/types';

function authenticate(req: NextRequest) {
  const token = getTokenFromCookieHeader(req.headers.get('cookie'));
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const requests = await prisma.maintenanceRequest.findMany({
      where: payload.role === 'landlord' ? { landlordId: payload.userId } : { tenantId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    // Batch-fetch related properties for enrichment
    const propertyIds = [...new Set(requests.map(r => r.propertyId))];
    const properties = propertyIds.length
      ? await prisma.property.findMany({
          where: { id: { in: propertyIds } },
          select: { id: true, title: true },
        })
      : [];
    const propMap = Object.fromEntries(properties.map(p => [p.id, p.title]));

    const enriched = requests.map(r => ({
      ...r,
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      propertyTitle: propMap[r.propertyId],
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('[GET /api/maintenance]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (payload.role !== 'tenant') {
      return NextResponse.json({ error: 'Only tenants can submit requests' }, { status: 403 });
    }

    // Support both single-property tenants and apartment-unit tenants
    const property = await prisma.property.findFirst({
      where: {
        OR: [
          { tenantId: payload.userId },
          { units: { some: { tenantId: payload.userId } } },
        ],
      },
    });
    if (!property) {
      return NextResponse.json({ error: 'You are not assigned to any property' }, { status: 400 });
    }

    const body = await req.json();
    const { title, issue, priority } = body;

    if (!title || !issue) {
      return NextResponse.json({ error: 'Title and issue description are required' }, { status: 400 });
    }

    const validPriorities: MaintenancePriority[] = ['low', 'medium', 'high', 'urgent'];
    const requestPriority: MaintenancePriority = validPriorities.includes(priority) ? priority : 'medium';

    const request = await prisma.maintenanceRequest.create({
      data: {
        title: title.trim(),
        issue: issue.trim(),
        status: 'pending',
        priority: requestPriority,
        tenantId: payload.userId,
        propertyId: property.id,
        landlordId: property.landlordId,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...request,
          resolvedAt: null,
          createdAt: request.createdAt.toISOString(),
          updatedAt: request.updatedAt.toISOString(),
        },
        message: 'Maintenance request submitted',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/maintenance]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
