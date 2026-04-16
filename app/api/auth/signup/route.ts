import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken, createAuthCookie } from '@/lib/auth';
import { SignupData, UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: SignupData = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    if (!['landlord', 'tenant'].includes(role as UserRole)) {
      return NextResponse.json({ error: 'Role must be landlord or tenant' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        phone: phone?.trim() || null,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'landlord' | 'tenant',
      name: user.name,
    });

    return NextResponse.json(
      {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          createdAt: user.createdAt.toISOString(),
        },
        message: 'Account created successfully',
      },
      {
        status: 201,
        headers: { 'Set-Cookie': createAuthCookie(token) },
      }
    );
  } catch (error) {
    console.error('[POST /api/auth/signup]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
