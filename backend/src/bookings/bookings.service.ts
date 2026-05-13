import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private getThaiToday() {
    const now = new Date();
    // Add 7 hours to get Thai time
    const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    // Set to UTC midnight for Prisma @db.Date comparison
    thaiTime.setUTCHours(0, 0, 0, 0);
    return thaiTime;
  }

  async joinQueue(serviceId: string, userId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // 1. Get or Create today's queue for this service using the unique constraint
    const today = this.getThaiToday();

    const queue = await this.prisma.queue.upsert({
      where: {
        serviceId_date: {
          serviceId,
          date: today,
        },
      },
      update: {},
      create: {
        serviceId,
        date: today,
        status: 'open',
      },
    });

    if (queue.status === 'closed') {
      throw new BadRequestException('Service is temporarily closed');
    }

    // 2. Transaction with SELECT ... FOR UPDATE to avoid race conditions
    return this.prisma.$transaction(async (tx) => {
      // Lock the queue row at the database level for the current transaction
      await tx.$queryRaw`SELECT * FROM queues WHERE id = ${queue.id}::uuid FOR UPDATE`;

      // Check current total bookings to enforce maxCapacity
      const currentBookingsCount = await tx.booking.count({
        where: { queueId: queue.id, status: { not: 'cancelled' } },
      });

      if (currentBookingsCount >= service.maxCapacity) {
        throw new BadRequestException('Queue has reached maximum capacity');
      }

      // Get the current max booking number for this queue
      const lastBooking = await tx.booking.findFirst({
        where: { queueId: queue.id },
        orderBy: { bookingNumber: 'desc' },
      });

      const nextNumber = (lastBooking?.bookingNumber || 0) + 1;

      // 3. Create the booking
      const booking = await tx.booking.create({
        data: {
          queueId: queue.id,
          userId,
          bookingNumber: nextNumber,
          status: 'waiting',
        },
      });

      // 4. Format the ID (e.g., ServiceName Initial + Number)
      const prefix = service.name.charAt(0).toUpperCase();
      const formattedId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;

      return {
        ...booking,
        formattedId,
        serviceName: service.name,
      };
    });
  }

  async getUserBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        queue: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enhance each booking with context
    return Promise.all(bookings.map(async (b) => {
      const waitingBefore = await this.prisma.booking.count({
        where: {
          queueId: b.queueId,
          status: 'waiting',
          bookingNumber: { lt: b.bookingNumber },
        }
      });

      const currentServing = await this.prisma.booking.findFirst({
        where: { queueId: b.queueId, status: 'serving' },
      });

      const allServiceQueues = await this.prisma.booking.findMany({
        where: { queueId: b.queueId },
        orderBy: { bookingNumber: 'asc' },
        take: 10, // Just show a few for context
      });

      return {
        ...b,
        waitingBefore,
        currentServingNumber: currentServing?.bookingNumber || 0,
        serviceQueues: allServiceQueues,
      };
    }));
  }

  async getAllBookings() {
    const today = this.getThaiToday();

    const bookings = await this.prisma.booking.findMany({
      where: { createdAt: { gte: today } },
      include: {
        queue: {
          include: { service: true },
        },
        user: true,
      },
      orderBy: { bookingNumber: 'asc' },
    });

    return bookings;
  }

  async callNext(serviceId: string) {
    const today = this.getThaiToday();

    // 1. Find today's queue for this service
    const queue = await this.prisma.queue.findFirst({
      where: { serviceId, date: today },
    });

    if (!queue) throw new NotFoundException('No queue today');

    // 2. Set current 'serving' to 'completed'
    await this.prisma.booking.updateMany({
      where: { queueId: queue.id, status: 'serving' },
      data: { status: 'completed' },
    });

    // 3. Find next 'waiting'
    const nextBooking = await this.prisma.booking.findFirst({
      where: { queueId: queue.id, status: 'waiting' },
      orderBy: { bookingNumber: 'asc' },
    });

    if (!nextBooking) return { message: 'No one waiting' };

    // 4. Set to 'serving' and update Queue.currentNumber
    const updatedBooking = await this.prisma.booking.update({
      where: { id: nextBooking.id },
      data: { status: 'serving' },
      include: { queue: { include: { service: true } } },
    });

    // Update the queue's current serving number
    await this.prisma.queue.update({
      where: { id: queue.id },
      data: { currentNumber: nextBooking.bookingNumber },
    });

    return updatedBooking;
  }

  async updateStatus(bookingId: string, status: string) {
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: { queue: { include: { service: true } } },
    });

    // If status is serving, update Queue.currentNumber
    if (status === 'serving') {
      await this.prisma.queue.update({
        where: { id: updatedBooking.queueId },
        data: { currentNumber: updatedBooking.bookingNumber },
      });
    }

    return updatedBooking;
  }

  async toggleQueueStatus(serviceId: string, status: string) {
    const today = this.getThaiToday();
    
    const existingQueue = await this.prisma.queue.findFirst({
      where: { serviceId, date: today }
    });

    if (existingQueue) {
      return this.prisma.queue.update({
        where: { id: existingQueue.id },
        data: { status },
      });
    } else {
      return this.prisma.queue.create({
        data: {
          serviceId,
          date: today,
          status,
        },
      });
    }
  }

  async getReports() {
    const total = await this.prisma.booking.count();
    const completed = await this.prisma.booking.count({ where: { status: 'completed' } });
    const cancelled = await this.prisma.booking.count({ where: { status: 'cancelled' } });

    // For charts, we'll group by service
    const serviceStats = await this.prisma.booking.groupBy({
      by: ['queueId'],
      _count: { _all: true },
    });

    // In a real app, you'd join with services here, but since groupBy in Prisma 
    // is limited, we'll keep it simple or fetch services separately.
    
    return {
      total,
      completed,
      cancelled,
      serviceStats,
    };
  }
}
