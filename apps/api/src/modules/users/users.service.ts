import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, role, status, search } = query || {};

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          assignedBrands: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        assignedBrands: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        preference: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: string;
    status?: string;
    brandIds?: string[];
  }) {
    const { email, name, password, role = 'BRAND_PLANNER', status = 'ACTIVE', brandIds } = data;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role as any,
        status: status as any,
        assignedBrands: brandIds ? {
          connect: brandIds.map(id => ({ id })),
        } : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    role?: string;
    status?: string;
    avatar?: string;
    brandIds?: string[];
  }) {
    const { name, role, status, avatar, brandIds } = data;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name,
        role: role as any,
        status: status as any,
        avatar,
        assignedBrands: brandIds ? {
          set: brandIds.map(id => ({ id })),
        } : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        updatedAt: true,
        assignedBrands: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new ConflictException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by setting status to INACTIVE
    await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return { deleted: true };
  }

  // User Preferences
  async getPreferences(userId: string) {
    let preference = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preference) {
      // Create default preferences
      preference = await this.prisma.userPreference.create({
        data: { userId },
      });
    }

    return preference;
  }

  async updatePreferences(userId: string, data: {
    theme?: string;
    language?: string;
    timezone?: string;
    dateFormat?: string;
    numberFormat?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    tablePageSize?: number;
  }) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}
