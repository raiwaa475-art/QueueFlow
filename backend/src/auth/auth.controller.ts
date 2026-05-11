import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseGuard } from './guards/supabase.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  @UseGuards(SupabaseGuard, AdminGuard)
  listUsers() {
    return this.authService.listUsers();
  }

  @Post('users/:id/role')
  @UseGuards(SupabaseGuard, AdminGuard)
  setRole(@Param('id') id: string, @Body() body: { isAdmin: boolean }) {
    return this.authService.setAdminRole(id, body.isAdmin);
  }
}
