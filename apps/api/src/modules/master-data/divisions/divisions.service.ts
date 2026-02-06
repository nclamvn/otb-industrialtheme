import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DivisionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; isActive?: boolean }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 100, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.division.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.division.count({ where }),
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
    const division = await this.prisma.division.findUnique({
      where: { id },
    });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    return division;
  }

  async create(data: any) {
    // Get max sortOrder
    const maxSort = await this.prisma.division.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.division.create({
      data: {
        ...data,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });
  }

  async update(id: string, data: any) {
    const division = await this.prisma.division.findUnique({ where: { id } });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    return this.prisma.division.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const division = await this.prisma.division.findUnique({ where: { id } });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    await this.prisma.division.delete({ where: { id } });
    return { deleted: true };
  }
}
