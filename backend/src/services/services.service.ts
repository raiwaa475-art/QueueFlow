import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  private getThaiToday() {
    const now = new Date();
    const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    thaiTime.setUTCHours(0, 0, 0, 0);
    return thaiTime;
  }

  async findAll() {
    const today = this.getThaiToday();

    return this.prisma.service.findMany({
      include: {
        queues: {
          where: {
            date: today,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: { queues: { orderBy: { date: 'desc' }, take: 1 } },
    });
  }

  async create(data: { name: string; description?: string; maxCapacity?: number }) {
    return this.prisma.service.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async getStats() {
    const today = this.getThaiToday();

    const waiting = await this.prisma.booking.count({
      where: { status: 'waiting', createdAt: { gte: today } },
    });

    const serving = await this.prisma.booking.count({
      where: { status: 'serving', createdAt: { gte: today } },
    });

    const completed = await this.prisma.booking.count({
      where: { status: 'completed', createdAt: { gte: today } },
    });

    return {
      waiting,
      serving,
      completed,
      avgWaitTime: 0,
    };
  }

  async getConfig() {
    return this.prisma.config.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
  }

  async updateConfig(data: any) {
    return this.prisma.config.update({
      where: { id: 1 },
      data,
    });
  }
}
