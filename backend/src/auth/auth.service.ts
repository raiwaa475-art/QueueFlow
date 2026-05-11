import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async listUsers() {
    const { data: { users }, error } = await this.supabaseService.getClient().auth.admin.listUsers();
    if (error) throw error;
    return users;
  }

  async setAdminRole(userId: string, isAdmin: boolean) {
    const { data, error } = await this.supabaseService.getClient().auth.admin.updateUserById(userId, {
      app_metadata: { role: isAdmin ? 'admin' : 'user' }
    });
    if (error) throw error;
    return data;
  }
}
