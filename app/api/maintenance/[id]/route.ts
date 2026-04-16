import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MaintenanceStatus } from '@/types';

function authenticate(req: NextRequest) {
  const token = getTokenFromCookieHeader(req.headers.get('cookie'));
  if (!token) return null;
  return verifyToken(token);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = authenticate(req);
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    if (payload.role === 'landlord') {
      if (request.landlordId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const body = await req.json();
      const validStatuses: MaintenanceStatus[] = ['pending', 'in_progress', 'resolved', 'rejected'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = { status: body.status };
      if (body.notes) updateData.notes = body.notes;
      if (body.status === 'resolved') updateData.resolvedAt = new Date();

      const updated = await prisma.maintenanceRequest.update({ where: { id }, data: updateData });

      return NextResponse.json({
        data: {
          ...updated,
          resolvedAt: updated.resolvedAt?.toISOString() ?? null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
        message: 'Request updated',
      });
    }

    // Tenants can only cancel their own pending requests
    if (payload.role === 'tenant') {
      if (request.tenantId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (request.status !== 'pending') {
        return NextResponse.json({ error: 'Can only cancel pending requests' }, { status: 400 });
      }

      const updated = await prisma.maintenanceRequest.update({
        where: { id },
        data: { status: 'rejected', notes: 'Cancelled by tenant' },
      });

      return NextResponse.json({
        data: {
          ...updated,
          resolvedAt: null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
        message: 'Request cancelled',
      });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('[PATCH /api/maintenance/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
