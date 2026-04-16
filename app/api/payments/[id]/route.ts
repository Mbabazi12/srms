import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookieHeader } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    if (payload.role === 'landlord' && payment.landlordId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (payload.role === 'tenant' && payment.tenantId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Tenants can only mark payments as 'paid'
    if (payload.role === 'tenant' && body.status !== 'paid') {
      return NextResponse.json({ error: 'Tenants can only mark payments as paid' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status: body.status };
    if (body.status === 'paid') updateData.date = new Date();
    if (body.notes) updateData.notes = body.notes;

    const updated = await prisma.payment.update({ where: { id }, data: updateData });

    return NextResponse.json({
      data: {
        ...updated,
        date: updated.date?.toISOString() ?? null,
        dueDate: updated.dueDate.toISOString(),
        createdAt: updated.createdAt.toISOString(),
      },
      message: 'Payment updated',
    });
  } catch (error) {
    console.error('[PATCH /api/payments/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
