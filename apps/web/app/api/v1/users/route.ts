export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createUserSchema } from '@/lib/validations/user';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admin-only access for user listing
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role: role as 'ADMIN' | 'FINANCE_HEAD' | 'FINANCE_USER' | 'BRAND_MANAGER' | 'BRAND_PLANNER' | 'MERCHANDISE_LEAD' | 'BOD_MEMBER' }),
      ...(status && { status: status as 'ACTIVE' | 'INACTIVE' | 'PENDING' }),
    };

    const users = await prisma.user.findMany({
      where,
      include: {
        assignedBrands: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove password from response
    const sanitizedUsers = users.map(({ password: _password, ...user }) => user);

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admin-only access for user creation
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
        status: validatedData.status,
        ...(validatedData.assignedBrandIds?.length && {
          assignedBrands: {
            connect: validatedData.assignedBrandIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        assignedBrands: true,
      },
    });

    const { password: _password, ...sanitizedUser } = user;

    return NextResponse.json({
      success: true,
      data: sanitizedUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
