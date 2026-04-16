import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

function authenticate(req: NextRequest) {
  const token = getTokenFromCookieHeader(req.headers.get('cookie'));
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (payload.role === 'landlord') {
      const properties = await prisma.property.findMany({
        where: { landlordId: payload.userId },
        orderBy: { createdAt: 'desc' },
      });

      // Collect all tenant IDs (from direct tenantId + unit tenantIds)
      const tenantIds = new Set<string>();
      properties.forEach(p => {
        if (p.tenantId) tenantIds.add(p.tenantId);
        (p.units ?? []).forEach(u => { if (u.tenantId) tenantIds.add(u.tenantId); });
      });

      const tenants = tenantIds.size
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(tenantIds) } },
            select: { id: true, name: true },
          })
        : [];
      const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t.name]));

      const enriched = properties.map(p => ({
        ...p,
        propertyType: p.propertyType ?? 'single',
        units: (p.units ?? []).map(u => ({
          ...u,
          tenantName: u.tenantId ? tenantMap[u.tenantId] : undefined,
        })),
        tenantName: p.tenantId ? tenantMap[p.tenantId] : undefined,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));

      return NextResponse.json({ data: enriched });
    }

    if (payload.role === 'tenant') {
      // Find property via direct assignment OR apartment unit assignment
      const property = await prisma.property.findFirst({
        where: {
          OR: [
            { tenantId: payload.userId },
            { units: { some: { tenantId: payload.userId } } },
          ],
        },
      });

      if (!property) return NextResponse.json({ data: [] });

      // Look up landlord name for tenant messaging
      const landlord = await prisma.user.findUnique({
        where: { id: property.landlordId },
        select: { name: true },
      });

      // Enrich unit data with tenant names if it's an apartment
      let enrichedUnits = property.units ?? [];
      if ((property.propertyType ?? 'single') === 'apartment' && enrichedUnits.length > 0) {
        const unitTenantIds = enrichedUnits.map(u => u.tenantId).filter(Boolean) as string[];
        const unitTenants = unitTenantIds.length
          ? await prisma.user.findMany({
              where: { id: { in: unitTenantIds } },
              select: { id: true, name: true },
            })
          : [];
        const unitTenantMap = Object.fromEntries(unitTenants.map(t => [t.id, t.name]));
        enrichedUnits = enrichedUnits.map(u => ({
          ...u,
          tenantName: u.tenantId ? unitTenantMap[u.tenantId] : undefined,
        }));
      }

      // Find the tenant's assigned unit (for apartments)
      const myUnit = (property.propertyType ?? 'single') === 'apartment'
        ? enrichedUnits.find(u => u.tenantId === payload.userId) ?? null
        : null;

      return NextResponse.json({
        data: [
          {
            ...property,
            propertyType: property.propertyType ?? 'single',
            units: enrichedUnits,
            myUnit,
            landlordName: landlord?.name,
            createdAt: property.createdAt.toISOString(),
            updatedAt: property.updatedAt.toISOString(),
          },
        ],
      });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('[GET /api/properties]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (payload.role !== 'landlord') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
      title, description, location, address, rent,
      bedrooms, bathrooms, area, amenities,
      propertyType, units: rawUnits,
    } = body;

    if (!title || !location || !address || !rent) {
      return NextResponse.json(
        { error: 'Title, location, address, and rent are required' },
        { status: 400 }
      );
    }

    const type: 'single' | 'apartment' =
      propertyType === 'apartment' ? 'apartment' : 'single';

    // Build units for apartment type — assign server-side IDs
    const units =
      type === 'apartment' && Array.isArray(rawUnits) && rawUnits.length > 0
        ? rawUnits
            .filter((u: { unitName?: string }) => u.unitName?.trim())
            .map((u: { unitName: string }) => ({
              unitId: randomUUID(),
              unitName: u.unitName.trim(),
              tenantId: null,
              status: 'vacant',
            }))
        : [];

    const property = await prisma.property.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        location: location.trim(),
        address: address.trim(),
        rent: Number(rent),
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 1,
        area: Number(area) || 0,
        amenities: Array.isArray(amenities) ? amenities : [],
        status: 'vacant',
        propertyType: type,
        units,
        landlordId: payload.userId,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...property,
          units: property.units ?? [],
          createdAt: property.createdAt.toISOString(),
          updatedAt: property.updatedAt.toISOString(),
        },
        message: 'Property created',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/properties]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
