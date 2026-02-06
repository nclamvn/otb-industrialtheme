import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SeasonsService {
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
      this.prisma.season.findMany({
        where,
        skip,
        take: limit,
        orderBy: { year: 'desc' },
      }),
      this.prisma.season.count({ where }),
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
    const season = await this.prisma.season.findUnique({
      where: { id },
    });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    return season;
  }

  async create(data: any) {
    return this.prisma.season.create({
      data,
    });
  }

  async update(id: string, data: any) {
    const season = await this.prisma.season.findUnique({ where: { id } });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    return this.prisma.season.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const season = await this.prisma.season.findUnique({ where: { id } });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    await this.prisma.season.delete({ where: { id } });
    return { deleted: true };
  }
}
