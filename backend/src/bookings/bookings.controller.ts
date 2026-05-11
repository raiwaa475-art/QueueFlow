import { Controller, Post, Get, Body, Req, UseGuards, Patch, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthService } from '../auth/auth.service';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly authService: AuthService,
  ) {}

  @Post('join')
  @UseGuards(SupabaseGuard)
  joinQueue(@Body() body: { serviceId: string }, @Req() req: any) {
    return this.bookingsService.joinQueue(body.serviceId, req.user.id);
  }

  @Get('my')
  @UseGuards(SupabaseGuard)
  getUserBookings(@Req() req: any) {
    return this.bookingsService.getUserBookings(req.user.id);
  }

  @Get('all')
  @UseGuards(SupabaseGuard, AdminGuard)
  async getAllBookings() {
    const bookings = await this.bookingsService.getAllBookings();
    const users: any[] = await this.authService.listUsers();
    
    // Map user data to bookings
    return bookings.map(b => ({
      ...b,
      user: users.find(u => u.id === b.userId) || { id: b.userId, email: 'unknown@user.com', user_metadata: { full_name: 'Unknown User' } }
    }));
  }

  @Get('reports')
  @UseGuards(SupabaseGuard, AdminGuard)
  getReports() {
    return this.bookingsService.getReports();
  }

  @Post('next')
  @UseGuards(SupabaseGuard, AdminGuard)
  callNext(@Body() body: { serviceId: string }) {
    return this.bookingsService.callNext(body.serviceId);
  }

  @Patch(':id/status')
  @UseGuards(SupabaseGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.bookingsService.updateStatus(id, body.status);
  }

  @Patch(':serviceId/queue-status')
  @UseGuards(SupabaseGuard, AdminGuard)
  toggleQueueStatus(@Param('serviceId') serviceId: string, @Body() body: { status: string }) {
    return this.bookingsService.toggleQueueStatus(serviceId, body.status);
  }
}
