import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

describe('BookingsController Integration Tests', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBookingsService = {
    joinQueue: jest.fn(),
    getUserBookings: jest.fn(),
    getAllBookings: jest.fn(),
    getReports: jest.fn(),
    callNext: jest.fn(),
    updateStatus: jest.fn(),
    toggleQueueStatus: jest.fn(),
  };

  const mockAuthService = {};
  const mockJwtService = { verifyAsync: jest.fn() };
  const mockConfigService = { get: jest.fn() };
  const mockSupabaseService = { verifyToken: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        { provide: BookingsService, useValue: mockBookingsService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('joinQueue()', () => {
    it('ควรส่งต่อ request ไปยัง BookingsService.joinQueue พร้อมข้อมูล serviceId และ userId ได้อย่างถูกต้อง', async () => {
      const mockResult = { id: 'b1', formattedId: 'G001', serviceName: 'General' };
      mockBookingsService.joinQueue.mockResolvedValue(mockResult);

      const req = { user: { id: 'usr-123' } };
      const body = { serviceId: 'srv-456' };

      const result = await controller.joinQueue(body, req);

      expect(service.joinQueue).toHaveBeenCalledWith('srv-456', 'usr-123');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserBookings()', () => {
    it('ควรส่งต่อ request เพื่อดึงคิวของ user ปัจจุบันผ่าน BookingsService.getUserBookings', async () => {
      const mockBookings = [{ id: 'b1', bookingNumber: 1 }];
      mockBookingsService.getUserBookings.mockResolvedValue(mockBookings);

      const req = { user: { id: 'usr-123' } };
      const result = await controller.getUserBookings(req);

      expect(service.getUserBookings).toHaveBeenCalledWith('usr-123');
      expect(result).toEqual(mockBookings);
    });
  });

  describe('getAllBookings()', () => {
    it('ควรดึงข้อมูลคิวทั้งหมดและแมปโครงสร้าง user ให้ตรงตามความต้องการของหน้าบ้าน (Frontend structure)', async () => {
      const mockDbBookings = [
        {
          id: 'b1',
          userId: 'usr-1',
          bookingNumber: 1,
          user: {
            id: 'usr-1',
            email: 'test@example.com',
            fullName: 'Test User',
          },
        },
        {
          id: 'b2',
          userId: 'usr-2',
          bookingNumber: 2,
          // กรณีไม่มี user object แนบมา
        },
      ];
      mockBookingsService.getAllBookings.mockResolvedValue(mockDbBookings);

      const result = await controller.getAllBookings();

      expect(service.getAllBookings).toHaveBeenCalled();
      expect(result).toHaveLength(2);

      // ตรวจสอบการแปลงโครงสร้างของ object แรกที่มี user
      expect(result[0].user).toEqual({
        id: 'usr-1',
        email: 'test@example.com',
        fullName: 'Test User',
        user_metadata: { full_name: 'Test User' },
      });

      // ตรวจสอบการแปลงโครงสร้างของ object ที่สองที่ไม่มี user
      expect(result[1].user).toEqual({
        id: 'usr-2',
        email: 'unknown@user.com',
        user_metadata: { full_name: 'Unknown User' },
      });
    });
  });

  describe('getReports()', () => {
    it('ควรดึงข้อมูลสรุปรายงานจาก BookingsService.getReports', async () => {
      const mockReports = { total: 10, completed: 8, cancelled: 2 };
      mockBookingsService.getReports.mockResolvedValue(mockReports);

      const result = await controller.getReports();

      expect(service.getReports).toHaveBeenCalled();
      expect(result).toEqual(mockReports);
    });
  });

  describe('callNext()', () => {
    it('ควรเรียกคิวถัดไปของบริการที่ระบุผ่าน BookingsService.callNext', async () => {
      const mockCalledBooking = { id: 'b2', status: 'serving' };
      mockBookingsService.callNext.mockResolvedValue(mockCalledBooking);

      const body = { serviceId: 'srv-1' };
      const result = await controller.callNext(body);

      expect(service.callNext).toHaveBeenCalledWith('srv-1');
      expect(result).toEqual(mockCalledBooking);
    });
  });

  describe('updateStatus()', () => {
    it('ควรอัปเดตสถานะการจองตาม id ที่ระบุผ่าน BookingsService.updateStatus', async () => {
      const mockUpdated = { id: 'b1', status: 'completed' };
      mockBookingsService.updateStatus.mockResolvedValue(mockUpdated);

      const result = await controller.updateStatus('b1', { status: 'completed' });

      expect(service.updateStatus).toHaveBeenCalledWith('b1', 'completed');
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('toggleQueueStatus()', () => {
    it('ควรเปิด/ปิดสถานะคิวของบริการผ่าน BookingsService.toggleQueueStatus', async () => {
      const mockToggled = { id: 'q1', status: 'closed' };
      mockBookingsService.toggleQueueStatus.mockResolvedValue(mockToggled);

      const result = await controller.toggleQueueStatus('srv-1', { status: 'closed' });

      expect(service.toggleQueueStatus).toHaveBeenCalledWith('srv-1', 'closed');
      expect(result).toEqual(mockToggled);
    });
  });
});
