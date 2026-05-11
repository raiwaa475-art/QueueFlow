import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has admin role in app_metadata
    if (user?.app_metadata?.role !== 'admin') {
      throw new ForbiddenException('Admin access only');
    }

    return true;
  }
}
