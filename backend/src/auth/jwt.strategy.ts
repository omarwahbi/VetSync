import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Define JWT payload shape
interface JwtPayload {
  username: string;
  sub: string;
  clinicId?: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secretKey = configService.get<string>('JWT_SECRET');
    
    if (!secretKey) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      // Find the user with clinic data included
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { 
          clinic: {
            select: {
              id: true,
              name: true,
              isActive: true,
              subscriptionEndDate: true,
              canSendReminders: true,
            }
          } 
        },
      });

      // Validate user exists
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Validate user is active
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // For admin users, we don't need to validate clinic
      if (user.role === 'ADMIN' && !user.clinicId) {
        // Admin without clinic is allowed
        const { password, ...result } = user;
        return result;
      }

      // For non-admin users, validate clinic exists and is active
      if (!user.clinic || !user.clinic.isActive) {
        throw new UnauthorizedException('Clinic subscription is inactive');
      }

      // Validate clinic subscription has not expired
      if (
        user.clinic.subscriptionEndDate &&
        new Date() > user.clinic.subscriptionEndDate
      ) {
        throw new UnauthorizedException('Clinic subscription has expired');
      }

      // Exclude the password hash from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      
      // Return the user (will be available as request.user)
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to authenticate token');
    }
  }
} 