import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, ensure the JWT is valid by calling the parent guard
    const isValid = await super.canActivate(context);
    
    if (!isValid) {
      return false;
    }
    
    // Get the request object (which now has the user property from JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check if the user has the ADMIN role
    if (user && user.role === UserRole.ADMIN) {
      return true;
    }
    
    // If the user doesn't have the ADMIN role, throw a ForbiddenException
    throw new ForbiddenException('You do not have sufficient permissions to access this resource');
  }
} 