import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class SupabaseGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
      if (!secret) {
        throw new Error('Missing SUPABASE_JWT_SECRET');
      }

      const payload = await this.jwtService.verifyAsync(token, { secret });

      // Attach user matching Supabase auth.getUser() structure
      request.user = {
        id: payload.sub,
        email: payload.email,
        app_metadata: payload.app_metadata || {},
        user_metadata: payload.user_metadata || {},
        role: payload.role,
      };
      return true;
    } catch (err) {
      // Fallback to Supabase verifyToken if local verification fails
      const user = await this.supabaseService.verifyToken(token);

      if (!user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      request.user = user;
      return true;
    }
  }
}
