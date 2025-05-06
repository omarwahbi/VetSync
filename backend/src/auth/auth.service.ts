import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, UserSession } from '@prisma/client';
import { RegisterDto, TokenResponseDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

type UserWithoutPassword = Omit<User, 'password'>;

interface JwtPayload {
  username: string;
  sub: string;
  clinicId?: string | null;
  role: UserRole;
}

interface RefreshTokenPayload {
  sub: string;
}

type UserSessionWithRelations = UserSession & {
  user: User & {
    clinic: {
      id: string;
      name: string;
      isActive: boolean;
      subscriptionEndDate: Date | null;
    } | null;
  };
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    this.logger.debug(`Attempting to validate user: ${email}`);
    
    // Normalize email to lowercase for lookup
    const lowerCaseEmail = email.toLowerCase();
    
    const user = await this.prisma.user.findUnique({
      where: { email: lowerCaseEmail },
      include: {
        clinic: {
          select: { 
            isActive: true, 
            subscriptionEndDate: true 
          },
        },
      },
    });

    if (!user) {
      this.logger.debug(`User not found: ${email}`);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    
    if (!isPasswordValid) {
      this.logger.debug(`Invalid password for user: ${email}`);
      return null;
    }

    // Check clinic status ONLY if the user is NOT a Platform Admin
    if (user.role !== UserRole.ADMIN) {
      const clinic = user.clinic;
      // Check if clinic is missing, inactive, or subscription expired
      if (
        !clinic ||
        !clinic.isActive ||
        !clinic.subscriptionEndDate ||
        clinic.subscriptionEndDate < new Date()
      ) {
        // Clinic is invalid - prevent login by returning null
        this.logger.warn(
          `Login failed for user ${email} due to inactive/expired/missing clinic.`,
        );
        return null; // Returning null signals failed validation to LocalStrategy
      }
    }

    // Exclude password and clinic from returned user object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, clinic, ...result } = user;
    this.logger.debug(`User validated successfully: ${email}`);
    return result;
  }

  async login(user: UserWithoutPassword, ipAddress?: string, userAgent?: string): Promise<TokenResponseDto> {
    this.logger.debug(`Generating tokens for user: ${user.email}`);
    
    // Get configuration values
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRATION_TIME');
    const refreshTokenSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
    const refreshTokenExpiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_TIME');
    
    // Create access token payload
    const accessTokenPayload: JwtPayload = {
      username: user.email,
      sub: user.id,
      clinicId: user.clinicId,
      role: user.role
    };

    // Generate access token
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    });
    
    // Create refresh token payload (minimal)
    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
    };
    
    // Generate refresh token
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
    });
    
    // Hash the refresh token before storing
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    
    // Calculate expiry date for the refresh token
    const refreshExpiresIn = refreshTokenExpiresIn || '7d';
    const expiresAt = new Date();

    // Add the appropriate time based on the string format
    if (refreshExpiresIn.endsWith('d')) {
      const days = parseInt(refreshExpiresIn.replace('d', ''), 10);
      expiresAt.setDate(expiresAt.getDate() + days);
    } else if (refreshExpiresIn.endsWith('h')) {
      const hours = parseInt(refreshExpiresIn.replace('h', ''), 10);
      expiresAt.setHours(expiresAt.getHours() + hours);
    } else if (refreshExpiresIn.endsWith('m')) {
      const minutes = parseInt(refreshExpiresIn.replace('m', ''), 10);
      expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
    } else if (refreshExpiresIn.endsWith('s')) {
      const seconds = parseInt(refreshExpiresIn.replace('s', ''), 10);
      expiresAt.setSeconds(expiresAt.getSeconds() + seconds);
    } else {
      // Default to 7 days if format is unrecognized
      expiresAt.setDate(expiresAt.getDate() + 7);
    }
    
    // Create a new session record
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: hashedRefreshToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
    
    this.logger.debug(`Tokens generated successfully for user: ${user.email}`);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId,
      },
    };
  }

  async findSessionByTokenHash(tokenHash: string): Promise<UserSessionWithRelations | null> {
    this.logger.debug('Finding session by token hash');
    
    try {
      const session = await this.prisma.userSession.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: {
              clinic: true
            }
          }
        }
      });
      
      return session;
    } catch (error) {
      this.logger.error(`Error finding session: ${error.message}`);
      return null;
    }
  }
  
  async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    this.logger.debug('Deleting session by token hash');
    
    try {
      await this.prisma.userSession.deleteMany({
        where: { tokenHash }
      });
      
      this.logger.debug('Session deleted successfully');
    } catch (error) {
      this.logger.error(`Error deleting session: ${error.message}`);
      throw new BadRequestException('Failed to delete session');
    }
  }
  
  async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    this.logger.debug(`Revoking refresh token for user ID: ${userId}`);
    
    if (!refreshToken) {
      this.logger.warn('No refresh token provided for revocation');
      return;
    }
    
    try {
      // Find all sessions for this user
      const userSessions = await this.prisma.userSession.findMany({
        where: { userId }
      });
      
      // Find the session with the matching refresh token
      for (const session of userSessions) {
        const isMatch = await bcrypt.compare(refreshToken, session.tokenHash);
        if (isMatch) {
          // Delete the matching session
          await this.prisma.userSession.delete({
            where: { id: session.id }
          });
          this.logger.debug('Refresh token revoked successfully');
          return;
        }
      }
      
      this.logger.debug('No matching refresh token found to revoke');
    } catch (error) {
      this.logger.error(`Error revoking refresh token: ${error.message}`);
      throw new BadRequestException('Failed to revoke refresh token');
    }
  }
  
  async rotateRefreshToken(
    userId: string, 
    oldTokenHash: string, 
    newRefreshToken: string, 
    newRefreshTokenExpiresAt: Date, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    this.logger.debug(`Rotating refresh token for user ID: ${userId}`);
    
    // Hash the new refresh token
    const hashedNewToken = await bcrypt.hash(newRefreshToken, 10);
    
    try {
      // Use a transaction to ensure atomicity
      await this.prisma.$transaction([
        // Delete the old session
        this.prisma.userSession.deleteMany({
          where: { tokenHash: oldTokenHash }
        }),
        
        // Create the new session
        this.prisma.userSession.create({
          data: {
            userId,
            tokenHash: hashedNewToken,
            expiresAt: newRefreshTokenExpiresAt,
            ipAddress,
            userAgent,
          }
        })
      ]);
      
      this.logger.debug('Refresh token rotated successfully');
    } catch (error) {
      this.logger.error(`Error rotating refresh token: ${error.message}`);
      throw new BadRequestException('Failed to rotate refresh token');
    }
  }

  async register(data: RegisterDto): Promise<UserWithoutPassword> {
    this.logger.debug(`Attempting to register user: ${data.email}`);

    // Normalize email to lowercase
    const lowerCaseEmail = data.email.toLowerCase();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: lowerCaseEmail },
    });

    if (existingUser) {
      this.logger.error(`Registration failed: User already exists: ${lowerCaseEmail}`);
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Determine user role
    let userRole: UserRole = UserRole.STAFF;
    if (data.role && Object.values(UserRole).includes(data.role)) {
      userRole = data.role;
    }
    
    try {
      // Create new user with hashed password
      const newUser = await this.prisma.user.create({
        data: {
          email: lowerCaseEmail,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          clinicId: data.clinicId,
          role: userRole,
        },
      });

      // Exclude password from returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = newUser;
      
      this.logger.debug(`User registered successfully: ${data.email}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Registration error for ${data.email}: ${error.message}`);
      throw new UnauthorizedException('Registration failed: ' + error.message);
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    this.logger.debug(`Attempting to change password for user ID: ${userId}`);

    try {
      // Find the user
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        this.logger.warn(`Password change failed: Incorrect current password for user ID: ${userId}`);
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash the new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

      // Update the user's password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      this.logger.debug(`Password changed successfully for user ID: ${userId}`);
      return { message: 'Password updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        this.logger.error(`Password change failed: User not found with ID: ${userId}`);
        throw new NotFoundException(`User not found with ID: ${userId}`);
      }
      this.logger.error(`Password change error for user ID ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to change password: ' + error.message);
    }
  }
} 