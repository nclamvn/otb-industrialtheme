import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LocationsService {
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
      this.prisma.salesLocation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.salesLocation.count({ where }),
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
    const location = await this.prisma.salesLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async create(data: any) {
    // Get max sortOrder
    const maxSort = await this.prisma.salesLocation.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.salesLocation.create({
      data: {
        ...data,
        sortOrder: (maxSort._max?.sortOrder || 0) + 1,
      },
    });
  }

  async update(id: string, data: any) {
    const location = await this.prisma.salesLocation.findUnique({ where: { id } });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return this.prisma.salesLocation.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const location = await this.prisma.salesLocation.findUnique({ where: { id } });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    await this.prisma.salesLocation.delete({ where: { id } });
    return { deleted: true };
  }
}
