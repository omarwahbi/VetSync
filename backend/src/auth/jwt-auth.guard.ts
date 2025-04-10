import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator'; // Adjust path if needed

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route has the @PublicRoute() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Method decorator
      context.getClass(),   // Class decorator
    ]);
    if (isPublic) {
      // If public, bypass JWT validation for this route
      return true;
    }
    // Otherwise, proceed with standard JWT authentication provided by AuthGuard('jwt')
    return super.canActivate(context);
  }
} 