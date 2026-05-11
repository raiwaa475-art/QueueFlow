import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('stats')
  @UseGuards(SupabaseGuard, AdminGuard)
  getStats() {
    return this.servicesService.getStats();
  }

  @Get('config')
  @UseGuards(SupabaseGuard, AdminGuard)
  getConfig() {
    return this.servicesService.getConfig();
  }

  @Patch('config')
  @UseGuards(SupabaseGuard, AdminGuard)
  updateConfig(@Body() body: any) {
    return this.servicesService.updateConfig(body);
  }

  @Post()
  @UseGuards(SupabaseGuard, AdminGuard)
  create(@Body() body: any) {
    return this.servicesService.create(body);
  }

  @Patch(':id')
  @UseGuards(SupabaseGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.servicesService.update(id, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
}
