import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BrandsService {
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
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          division: true,
        },
      }),
      this.prisma.brand.count({ where }),
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
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        division: true,
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async create(data: any) {
    // Get max sortOrder
    const maxSort = await this.prisma.brand.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.brand.create({
      data: {
        ...data,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
      include: {
        division: true,
      },
    });
  }

  async update(id: string, data: any) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return this.prisma.brand.update({
      where: { id },
      data,
      include: {
        division: true,
      },
    });
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    await this.prisma.brand.delete({ where: { id } });
    return { deleted: true };
  }
}
