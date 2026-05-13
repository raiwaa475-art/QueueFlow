import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SupabaseGuard } from '../src/auth/guards/supabase.guard';
import { AdminGuard } from '../src/auth/guards/admin.guard';
import { BookingsService } from '../src/bookings/bookings.service';

describe('BookingsController (e2e)', () => {
  let app: INestApplication<App>;

  const mockBookingsService = {
    joinQueue: jest.fn(),
    getUserBookings: jest.fn(),
    getAllBookings: jest.fn(),
    getReports: jest.fn(),
    callNext: jest.fn(),
    updateStatus: jest.fn(),
    toggleQueueStatus: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(SupabaseGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const auth = req.headers.authorization;
          if (auth === 'Bearer user-token') {
            req.user = { id: 'usr-123', email: 'user@example.com' };
            return true;
          }
          if (auth === 'Bearer admin-token') {
            req.user = {
              id: 'admin-123',
              email: 'admin@example.com',
              app_metadata: { role: 'admin' },
            };
            return true;
          }
          return false;
        },
      })
      .overrideGuard(AdminGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          return req.user?.app_metadata?.role === 'admin';
        },
      })
      .overrideProvider(BookingsService)
      .useValue(mockBookingsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /bookings/join', () => {
    it('ควรตอบกลับ 403 Forbidden/Unauthorized เมื่อไม่ส่ง Token', () => {
      return request(app.getHttpServer())
        .post('/bookings/join')
        .send({ serviceId: 'srv-1' })
        .expect(403);
    });

    it('ควรเข้าร่วมคิวได้สำเร็จเมื่อส่ง Token ถูกต้อง (201 Created)', () => {
      const mockResponse = { id: 'b1', formattedId: 'G001', serviceName: 'General' };
      mockBookingsService.joinQueue.mockResolvedValueOnce(mockResponse);

      return request(app.getHttpServer())
        .post('/bookings/join')
        .set('Authorization', 'Bearer user-token')
        .send({ serviceId: 'srv-1' })
        .expect(201)
        .expect(mockResponse);
    });
  });

  describe('GET /bookings/my', () => {
    it('ควรดึงข้อมูลคิวของฉันได้สำเร็จ (200 OK)', () => {
      const mockList = [{ id: 'b1', bookingNumber: 1 }];
      mockBookingsService.getUserBookings.mockResolvedValueOnce(mockList);

      return request(app.getHttpServer())
        .get('/bookings/my')
        .set('Authorization', 'Bearer user-token')
        .expect(200)
        .expect(mockList);
    });
  });

  describe('GET /bookings/all', () => {
    it('ควรปฏิเสธการเข้าถึง (403 Forbidden) หากไม่ใช่ Admin', () => {
      return request(app.getHttpServer())
        .get('/bookings/all')
        .set('Authorization', 'Bearer user-token') // สิทธิ์ user ธรรมดา
        .expect(403);
    });

    it('ควรดึงข้อมูลทั้งหมดได้เมื่อเป็น Admin (200 OK)', () => {
      mockBookingsService.getAllBookings.mockResolvedValueOnce([
        { id: 'b1', userId: 'u1', bookingNumber: 1 },
      ]);

      return request(app.getHttpServer())
        .get('/bookings/all')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].user).toBeDefined();
        });
    });
  });

  describe('POST /bookings/next', () => {
    it('ควรเรียกคิวถัดไปได้สำเร็จเมื่อเป็น Admin (201 Created)', () => {
      const mockResult = { id: 'b2', status: 'serving' };
      mockBookingsService.callNext.mockResolvedValueOnce(mockResult);

      return request(app.getHttpServer())
        .post('/bookings/next')
        .set('Authorization', 'Bearer admin-token')
        .send({ serviceId: 'srv-1' })
        .expect(201)
        .expect(mockResult);
    });
  });

  describe('PATCH /bookings/:id/status', () => {
    it('ควรอัปเดตสถานะคิวได้สำเร็จเมื่อเป็น Admin (200 OK)', () => {
      const mockResult = { id: 'b1', status: 'completed' };
      mockBookingsService.updateStatus.mockResolvedValueOnce(mockResult);

      return request(app.getHttpServer())
        .patch('/bookings/b1/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'completed' })
        .expect(200)
        .expect(mockResult);
    });
  });
});
