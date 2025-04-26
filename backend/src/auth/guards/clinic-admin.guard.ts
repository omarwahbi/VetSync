import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class ClinicAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Get the request object (which has the user property from JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check if the user has the CLINIC_ADMIN role
    if (user && user.role === UserRole.CLINIC_ADMIN) {
      return true;
    }
    
    // If the user doesn't have the CLINIC_ADMIN role, throw a ForbiddenException
    throw new ForbiddenException(
      'You do not have sufficient permissions to access this resource',
    );
  }
} 