import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BookingsService Unit Tests', () => {
  let service: BookingsService;
  let prisma: PrismaService;

  // โครงสร้าง Mock สำหรับ PrismaService และออบเจกต์ Transaction
  const mockPrisma = {
    service: {
      findUnique: jest.fn(),
    },
    queue: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    booking: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    // จำลอง $transaction ให้เรียก callback ทันทีโดยส่ง mockPrisma ตัวเดิมเข้าไปเป็น tx
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    // จำลอง $queryRaw สำหรับคำสั่งล็อกระดับฐานข้อมูล (SELECT ... FOR UPDATE)
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =======================================================================
  // 1. joinQueue(serviceId, userId)
  // =======================================================================
  describe('joinQueue()', () => {
    // Happy path 1: จองคิวสำเร็จเมื่อเป็นคิวแรกของวัน
    it('ควรสร้างการจองคิวแรกของวันได้สำเร็จ (Happy Path 1)', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', name: 'General', maxCapacity: 10 });
      mockPrisma.queue.upsert.mockResolvedValue({ id: 'q1', status: 'open' });
      mockPrisma.booking.count.mockResolvedValue(0);
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue({
        id: 'b1',
        queueId: 'q1',
        userId: 'u1',
        bookingNumber: 1,
        status: 'waiting',
      });

      const result = await service.joinQueue('s1', 'u1');
      expect(result.formattedId).toBe('G001');
      expect(result.bookingNumber).toBe(1);
      expect(result.serviceName).toBe('General');
    });

    // Happy path 2: จองคิวสำเร็จเมื่อมีคิวก่อนหน้าอยู่แล้ว
    it('ควรเพิ่มหมายเลขคิวต่อจากคิวล่าสุดได้อย่างถูกต้อง (Happy Path 2)', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', name: 'Dental', maxCapacity: 10 });
      mockPrisma.queue.upsert.mockResolvedValue({ id: 'q1', status: 'open' });
      mockPrisma.booking.count.mockResolvedValue(5);
      mockPrisma.booking.findFirst.mockResolvedValue({ bookingNumber: 5 });
      mockPrisma.booking.create.mockResolvedValue({
        id: 'b2',
        queueId: 'q1',
        userId: 'u1',
        bookingNumber: 6,
        status: 'waiting',
      });

      const result = await service.joinQueue('s1', 'u1');
      expect(result.formattedId).toBe('D006');
      expect(result.bookingNumber).toBe(6);
    });

    // Edge case: input เป็น empty string หรือ null/undefined
    it('ควรจัดการกรณี Edge Case input เป็น empty string หรือ null/undefined ได้อย่างปลอดภัย', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);
      await expect(service.joinQueue('', 'u1')).rejects.toThrow(NotFoundException);
      await expect(service.joinQueue(null as any, 'u1')).rejects.toThrow(NotFoundException);
      await expect(service.joinQueue(undefined as any, 'u1')).rejects.toThrow(NotFoundException);
    });

    // Error case 1: Service ไม่พบในระบบ (throw NotFoundException)
    it('ควร throw NotFoundException เมื่อไม่พบบริการในระบบ', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);
      await expect(service.joinQueue('invalid-id', 'u1')).rejects.toThrow(NotFoundException);
    });

    // Error case 2: คิวปิดให้บริการชั่วคราว (throw BadRequestException)
    it('ควร throw BadRequestException เมื่อสถานะคิวเป็น closed', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', name: 'General', maxCapacity: 10 });
      mockPrisma.queue.upsert.mockResolvedValue({ id: 'q1', status: 'closed' });
      await expect(service.joinQueue('s1', 'u1')).rejects.toThrow(BadRequestException);
    });

    // Error case 3: คิวเต็มความจุสูงสุด (throw BadRequestException)
    it('ควร throw BadRequestException เมื่อคิวเต็ม (ถึง maxCapacity)', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', name: 'General', maxCapacity: 2 });
      mockPrisma.queue.upsert.mockResolvedValue({ id: 'q1', status: 'open' });
      mockPrisma.booking.count.mockResolvedValue(2); // มีคนจอง 2 คน ซึ่งเท่ากับ maxCapacity
      await expect(service.joinQueue('s1', 'u1')).rejects.toThrow(BadRequestException);
    });
  });

  // =======================================================================
  // 2. getUserBookings(userId)
  // =======================================================================
  describe('getUserBookings()', () => {
    // Happy path 1: คืนค่ารายการจองคิวพร้อมคำนวณบริบทจำนวนคิวก่อนหน้า
    it('ควรดึงข้อมูลการจองของผู้ใช้พร้อมเสริมบริบท (คิวก่อนหน้าและคิวที่กำลังให้บริการ) ได้ถูกต้อง (Happy Path 1)', async () => {
      const mockBooking = { id: 'b1', queueId: 'q1', bookingNumber: 3, queue: { service: { name: 'Test' } } };
      // findMany ครั้งแรกดึงคิวของ User, ครั้งต่อมาดึงคิวทั้งหมดของ service นั้น
      mockPrisma.booking.findMany
        .mockResolvedValueOnce([mockBooking])
        .mockResolvedValueOnce([{ bookingNumber: 1 }, { bookingNumber: 2 }, { bookingNumber: 3 }]);
      
      mockPrisma.booking.count.mockResolvedValue(2); // มี 2 คิวรออยู่ก่อนหน้า
      mockPrisma.booking.findFirst.mockResolvedValue({ bookingNumber: 1 }); // คิวที่กำลังให้บริการคือเบอร์ 1

      const result = await service.getUserBookings('u1');
      expect(result).toHaveLength(1);
      expect(result[0].waitingBefore).toBe(2);
      expect(result[0].currentServingNumber).toBe(1);
      expect(result[0].serviceQueues).toHaveLength(3);
    });

    // Happy path 2: คืนค่า array ว่างเมื่อผู้ใช้ไม่เคยจองคิว
    it('ควรคืนค่า array ว่างเมื่อผู้ใช้ไม่มีประวัติการจอง (Happy Path 2)', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      const result = await service.getUserBookings('u2');
      expect(result).toEqual([]);
    });

    // Edge case: userId เป็น empty string
    it('ควรทำงานได้ปกติและคืน array ว่างเมื่อ userId เป็น empty string (Edge Case)', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      const result = await service.getUserBookings('');
      expect(result).toEqual([]);
    });
  });

  // =======================================================================
  // 3. getAllBookings()
  // =======================================================================
  describe('getAllBookings()', () => {
    // Happy path 1: คืนค่ารายการทั้งหมดของวันนี้
    it('ควรดึงข้อมูลการจองคิวทั้งหมดของวันนี้เรียงตามหมายเลขคิว (Happy Path 1)', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([{ id: 'b1', bookingNumber: 1 }, { id: 'b2', bookingNumber: 2 }]);
      const result = await service.getAllBookings();
      expect(result).toHaveLength(2);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { bookingNumber: 'asc' },
        }),
      );
    });

    // Happy path 2: คืนค่า array ว่างถ้าไม่มีคิวเลยในวันนี้
    it('ควรคืนค่า array ว่างเมื่อไม่มีการจองคิวในวันนี้ (Happy Path 2)', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      const result = await service.getAllBookings();
      expect(result).toEqual([]);
    });
  });

  // =======================================================================
  // 4. callNext(serviceId)
  // =======================================================================
  describe('callNext()', () => {
    // Happy path 1: มีคิวรออยู่ ทำการเรียกคิวถัดไปและอัปเดตสถานะคิวปัจจุบันเป็น serving
    it('ควรเรียกคิวถัดไปให้บริการ พร้อมอัปเดตคิวเดิมเป็น completed และอัปเดต currentNumber ใน Queue (Happy Path 1)', async () => {
      mockPrisma.queue.findFirst.mockResolvedValue({ id: 'q1' });
      mockPrisma.booking.findFirst.mockResolvedValue({ id: 'b1', bookingNumber: 2 });
      mockPrisma.booking.update.mockResolvedValue({ id: 'b1', status: 'serving', bookingNumber: 2 });

      const result = await service.callNext('s1');
      expect(result).toHaveProperty('status', 'serving');
      expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith({
        where: { queueId: 'q1', status: 'serving' },
        data: { status: 'completed' },
      });
      expect(mockPrisma.queue.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { currentNumber: 2 },
      });
    });

    // Happy path 2: ไม่มีคิวรออยู่เลย คืนค่าข้อความแจ้งเตือน
    it('ควรคืนค่าข้อความแจ้งเตือนเมื่อไม่มีคิวรออยู่เลย (Happy Path 2)', async () => {
      mockPrisma.queue.findFirst.mockResolvedValue({ id: 'q1' });
      mockPrisma.booking.findFirst.mockResolvedValue(null); // ไม่มีใครรอ

      const result = await service.callNext('s1');
      expect(result).toEqual({ message: 'No one waiting' });
      expect(mockPrisma.booking.update).not.toHaveBeenCalled();
    });

    // Error case: ไม่พบคิวของบริการในวันนี้ (throw NotFoundException)
    it('ควร throw NotFoundException เมื่อไม่มีข้อมูลคิวของบริการในวันนี้', async () => {
      mockPrisma.queue.findFirst.mockResolvedValue(null);
      await expect(service.callNext('s1')).rejects.toThrow(NotFoundException);
    });

    // Edge case: serviceId ว่าง
    it('ควรจัดการกรณี serviceId เป็นค่าว่างได้อย่างถูกต้อง', async () => {
      mockPrisma.queue.findFirst.mockResolvedValue(null);
      await expect(service.callNext('')).rejects.toThrow(NotFoundException);
    });
  });

  // =======================================================================
  // 5. updateStatus(bookingId, status)
  // =======================================================================
  describe('updateStatus()', () => {
    // Happy path 1: อัปเดตสถานะทั่วไป (เช่น cancelled)
    it('ควรอัปเดตสถานะการจองได้อย่างถูกต้องโดยไม่อัปเดต currentNumber ของคิวหากไม่ใช่สถานะ serving (Happy Path 1)', async () => {
      mockPrisma.booking.update.mockResolvedValue({ id: 'b1', queueId: 'q1', status: 'cancelled', bookingNumber: 5 });
      const result = await service.updateStatus('b1', 'cancelled');
      expect(result.status).toBe('cancelled');
      expect(mockPrisma.queue.update).not.toHaveBeenCalled();
    });

    // Happy path 2: อัปเดตสถานะเป็น 'serving' จะต้องไปอัปเดต Queue.currentNumber ด้วย
    it('ควรอัปเดต Queue.currentNumber เพิ่มเติมเมื่อสถานะใหม่คือ serving (Happy Path 2)', async () => {
      mockPrisma.booking.update.mockResolvedValue({ id: 'b1', queueId: 'q1', status: 'serving', bookingNumber: 3 });
      const result = await service.updateStatus('b1', 'serving');
      expect(result.status).toBe('serving');
      expect(mockPrisma.queue.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { currentNumber: 3 },
      });
    });

    // Error case: bookingId ไม่ถูกต้องทำให้ Prisma throw error
    it('ควร throw error เมื่อไม่พบรายการจองที่ต้องการอัปเดต', async () => {
      mockPrisma.booking.update.mockRejectedValue(new Error('Record to update not found'));
      await expect(service.updateStatus('invalid-id', 'serving')).rejects.toThrow();
    });

    // Edge case: status เป็น empty string
    it('ควรจัดการกรณี edge case status เป็น empty string ได้', async () => {
      mockPrisma.booking.update.mockResolvedValue({ id: 'b1', queueId: 'q1', status: '', bookingNumber: 3 });
      const result = await service.updateStatus('b1', '');
      expect(result.status).toBe('');
    });
  });

  // =======================================================================
  // 6. toggleQueueStatus(serviceId, status)
  // =======================================================================
  describe('toggleQueueStatus()', () => {
    // Happy path 1: มีคิวของวันนี้อยู่แล้ว ทำการอัปเดตสถานะ
    it('ควรอัปเดตสถานะของคิวที่มีอยู่แล้วในวันนี้ (Happy Path 1)', async () => {
      mockPrisma.queue.findFirst.mockResolvedValue({ id: 'q1', status: 'open' });
      mockPrisma.queue.update.mockResolvedValue({ id: 'q1', status: 'closed' });

      const result = await service.toggleQueueStatus('s1', 'closed');
      expect(result.status).toBe('closed');
      expect(mockPrisma.queue.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { status: 'closed' },
      });
    });

    // Happy path 2: ยังไม่มีคิวของวันนี้ ทำการสร้างคิวใหม่พร้อมกำหนดสถานะ
    it('ควรสร้างคิวใหม่ของวันนี้พร้อมกำหนดสถานะเมื่อยังไม่พบคิว (Happy Path 2)', async () => {
      mockPrisma.queue.findFirst.mockResolvedValue(null);
      mockPrisma.queue.create.mockResolvedValue({ id: 'q2', status: 'open' });

      const result = await service.toggleQueueStatus('s1', 'open');
      expect(result.status).toBe('open');
      expect(mockPrisma.queue.create).toHaveBeenCalled();
    });

    // Edge case: serviceId หรือ status เป็นค่าว่าง
    it('ควรทำงานได้อย่างปลอดภัยเมื่อ input เป็นค่าว่าง (Edge Case)', async () => {
      mockPrisma.queue.findFirst.mockResolvedValue(null);
      mockPrisma.queue.create.mockResolvedValue({ id: 'q3', status: '' });
      const result = await service.toggleQueueStatus('', '');
      expect(result.status).toBe('');
    });
  });

  // =======================================================================
  // 7. getReports()
  // =======================================================================
  describe('getReports()', () => {
    // Happy path 1: ดึงรายงานสรุปผลได้ถูกต้องครบถ้วน
    it('ควรรวบรวมสถิติการจองคิวทั้งหมดได้อย่างถูกต้อง (Happy Path 1)', async () => {
      // จำลองลำดับการคืนค่าของ count() ให้ตรงกับ: total, completed, cancelled
      mockPrisma.booking.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(70)  // completed
        .mockResolvedValueOnce(10); // cancelled

      mockPrisma.booking.groupBy.mockResolvedValue([
        { queueId: 'q1', _count: { _all: 60 } },
        { queueId: 'q2', _count: { _all: 40 } },
      ]);

      const result = await service.getReports();
      expect(result.total).toBe(100);
      expect(result.completed).toBe(70);
      expect(result.cancelled).toBe(10);
      expect(result.serviceStats).toHaveLength(2);
    });

    // Happy path 2: กรณีไม่มีข้อมูลการจองเลยในระบบ
    it('ควรคืนค่า 0 และ array ว่างเมื่อไม่มีข้อมูลในระบบเลย (Happy Path 2)', async () => {
      mockPrisma.booking.count.mockResolvedValue(0);
      mockPrisma.booking.groupBy.mockResolvedValue([]);

      const result = await service.getReports();
      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.cancelled).toBe(0);
      expect(result.serviceStats).toEqual([]);
    });
  });
});
