import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';

function authenticate(req: NextRequest) {
  const token = getTokenFromCookieHeader(req.headers.get('cookie'));
  if (!token) return null;
  return verifyToken(token);
}

/** Compute overall property status from units for an apartment */
function computeApartmentStatus(units: { status: string }[]): 'vacant' | 'partial' | 'occupied' {
  if (units.length === 0) return 'vacant';
  const occupied = units.filter(u => u.status === 'occupied').length;
  if (occupied === 0) return 'vacant';
  if (occupied === units.length) return 'occupied';
  return 'partial';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    if (payload.role === 'landlord' && property.landlordId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (payload.role === 'tenant') {
      // Allow access for direct tenantId OR unit-based assignment (apartments)
      const units = property.units ?? [];
      const isTenantOfUnit = units.some(u => u.tenantId === payload.userId);
      if (property.tenantId !== payload.userId && !isTenantOfUnit) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Collect all tenant IDs for enrichment
    const tenantIds = new Set<string>();
    if (property.tenantId) tenantIds.add(property.tenantId);
    (property.units ?? []).forEach(u => { if (u.tenantId) tenantIds.add(u.tenantId); });

    const tenants = tenantIds.size
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(tenantIds) } },
          select: { id: true, name: true },
        })
      : [];
    const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t.name]));

    return NextResponse.json({
      data: {
        ...property,
        propertyType: property.propertyType ?? 'single',
        units: (property.units ?? []).map(u => ({
          ...u,
          tenantName: u.tenantId ? tenantMap[u.tenantId] : undefined,
        })),
        tenantName: property.tenantId ? tenantMap[property.tenantId] : undefined,
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[GET /api/properties/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (payload.role !== 'landlord') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    if (property.landlordId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    // ── Unit tenant assignment (apartments) ───────────────────────────────────
    if (action === 'assign-unit') {
      const { unitId, tenantId } = body;
      if (!unitId || !tenantId) {
        return NextResponse.json({ error: 'unitId and tenantId are required' }, { status: 400 });
      }

      const tenant = await prisma.user.findUnique({ where: { id: tenantId } });
      if (!tenant || tenant.role !== 'tenant') {
        return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
      }

      const units = property.units ?? [];
      const unitIndex = units.findIndex(u => u.unitId === unitId);
      if (unitIndex === -1) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
      if (units[unitIndex].status === 'occupied') {
        return NextResponse.json({ error: 'Unit is already occupied' }, { status: 400 });
      }

      // Create payment for this tenant-unit
      const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const existing = await prisma.payment.findFirst({
        where: { propertyId: id, tenantId, month: currentMonth },
      });
      if (!existing) {
        const now = new Date();
        await prisma.payment.create({
          data: {
            amount: property.rent,
            status: 'pending',
            dueDate: new Date(now.getFullYear(), now.getMonth(), 1),
            propertyId: id,
            tenantId,
            landlordId: payload.userId,
            month: currentMonth,
          },
        });
      }

      const updatedUnits = units.map((u, i) =>
        i === unitIndex ? { ...u, tenantId, status: 'occupied' } : u
      );
      const newStatus = computeApartmentStatus(updatedUnits);

      const updated = await prisma.property.update({
        where: { id },
        data: { units: updatedUnits, status: newStatus },
      });

      return NextResponse.json({
        data: {
          ...updated,
          units: updated.units ?? [],
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
        message: 'Tenant assigned to unit',
      });
    }

    // ── Unit tenant removal (apartments) ─────────────────────────────────────
    if (action === 'unassign-unit') {
      const { unitId } = body;
      if (!unitId) return NextResponse.json({ error: 'unitId is required' }, { status: 400 });

      const units = property.units ?? [];
      const unitIndex = units.findIndex(u => u.unitId === unitId);
      if (unitIndex === -1) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });

      const updatedUnits = units.map((u, i) =>
        i === unitIndex ? { ...u, tenantId: null, status: 'vacant' } : u
      );
      const newStatus = computeApartmentStatus(updatedUnits);

      const updated = await prisma.property.update({
        where: { id },
        data: { units: updatedUnits, status: newStatus },
      });

      return NextResponse.json({
        data: {
          ...updated,
          units: updated.units ?? [],
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
        message: 'Tenant removed from unit',
      });
    }

    // ── Single property tenant assignment (existing behaviour) ────────────────
    if (body.tenantId && !property.tenantId) {
      const tenant = await prisma.user.findUnique({ where: { id: body.tenantId } });
      if (!tenant || tenant.role !== 'tenant') {
        return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
      }

      const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const existing = await prisma.payment.findFirst({
        where: { propertyId: id, month: currentMonth },
      });
      if (!existing) {
        const now = new Date();
        await prisma.payment.create({
          data: {
            amount: property.rent,
            status: 'pending',
            dueDate: new Date(now.getFullYear(), now.getMonth(), 1),
            propertyId: id,
            tenantId: body.tenantId,
            landlordId: payload.userId,
            month: currentMonth,
          },
        });
      }
      body.status = 'occupied';
    }

    // ── Single property tenant removal ────────────────────────────────────────
    if (body.tenantId === null) {
      body.status = 'vacant';
    }

    // Strip action key before forwarding to Prisma
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { action: _action, ...updateData } = body;

    const updated = await prisma.property.update({ where: { id }, data: updateData });

    return NextResponse.json({
      data: {
        ...updated,
        units: updated.units ?? [],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      message: 'Property updated',
    });
  } catch (error) {
    console.error('[PATCH /api/properties/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (payload.role !== 'landlord') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    if (property.landlordId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Delete related records first, then the property
    await prisma.payment.deleteMany({ where: { propertyId: id } });
    await prisma.maintenanceRequest.deleteMany({ where: { propertyId: id } });
    await prisma.property.delete({ where: { id } });

    return NextResponse.json({ message: 'Property deleted' });
  } catch (error) {
    console.error('[DELETE /api/properties/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
