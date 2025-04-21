import {
  Controller,
  Post,
  UseGuards,
  Get,
  Body,
  Logger,
  Patch,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PublicRoute } from './public.decorator';
import { RegisterDto } from './dto/auth.dto';
import { User, UserRole } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Response, Request as ExpressRequest } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  @PublicRoute()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Req() req,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ access_token: string }> {
    this.logger.log(`Login attempt for user: ${req.user.email}`);
    
    const user = req.user as User;
    
    const { access_token, refresh_token } = await this.authService.login(
      user,
    );
    
    this.setRefreshTokenCookie(response, refresh_token);
    
    return { access_token };
  }

  @PublicRoute()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ access_token: string }> {
    this.logger.log('Refresh token request received');
    
    // Get cookie name from config
    const cookieName = this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') || 'jid';
    
    // Extract refresh token from cookies
    const providedRefreshToken = request.cookies?.[cookieName];
    
    if (!providedRefreshToken) {
      this.logger.warn('Refresh token missing in cookies');
      throw new UnauthorizedException('Refresh token is missing');
    }
    
    try {
      // Step 1: Verify JWT validity
      const payload = await this.jwtService.verifyAsync(providedRefreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
      
      const userId = payload.sub;
      
      // Step 2: Hash the token and find session
      const hashedToken = await bcrypt.hash(providedRefreshToken, 10);
      
      // Find the session with this token
      let session;
      let foundTokenHash;
      
      // We need to find the session with this token by checking all user sessions
      const userSessions = await this.prismaService.userSession.findMany({
        where: { userId },
        include: {
          user: {
            include: { clinic: true }
          }
        }
      });
      
      // Check each session to find the one with the matching token
      for (const s of userSessions) {
        const isMatch = await bcrypt.compare(providedRefreshToken, s.tokenHash);
        if (isMatch) {
          session = s;
          foundTokenHash = s.tokenHash;
          break;
        }
      }
      
      if (!session) {
        this.logger.warn(`No valid session found for user ID: ${userId}`);
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await this.authService.deleteSessionByTokenHash(foundTokenHash);
        throw new UnauthorizedException('Refresh token has expired');
      }
      
      // Check clinic subscription status (skip for admins)
      const user = session.user;
      if (user.role !== UserRole.ADMIN) {
        const clinic = user.clinic;
        
        if (!clinic || !clinic.isActive || 
            !clinic.subscriptionEndDate || 
            clinic.subscriptionEndDate < new Date()) {
          
          // Subscription inactive or expired, remove refresh token
          await this.authService.deleteSessionByTokenHash(foundTokenHash);
          
          this.logger.warn(`Clinic subscription inactive or expired for user ID: ${userId}`);
          throw new UnauthorizedException('Clinic subscription inactive or expired.');
        }
      }
      
      // Generate new tokens (token rotation)
      const refreshTokenSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
      const refreshTokenExpiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_TIME') || '7d';
      
      // Create new refresh token
      const refreshTokenPayload = { sub: userId };
      const newRefreshToken = this.jwtService.sign(refreshTokenPayload, {
        secret: refreshTokenSecret,
        expiresIn: refreshTokenExpiresIn,
      });
      
      // Create new access token
      const accessTokenPayload = {
        username: user.email,
        sub: user.id,
        clinicId: user.clinicId,
        role: user.role
      };
      
      const newAccessToken = this.jwtService.sign(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME'),
      });
      
      // Calculate the expiry for the new refresh token
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
      
      // Rotate the refresh token (delete old, create new)
      await this.authService.rotateRefreshToken(
        userId,
        foundTokenHash,
        newRefreshToken,
        expiresAt,
        request.ip,
        request.get('user-agent')
      );
      
      // Set the new refresh token cookie
      response.cookie(cookieName, newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      this.logger.log(`New tokens generated for user ID: ${userId}`);
      
      return { access_token: newAccessToken };
    } catch (error) {
      this.logger.error(`Refresh token validation failed: ${error.message}`);
      
      // Clear the invalid cookie
      response.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ message: string }> {
    const userId = (req.user as User).id;
    // Get cookie name from config
    const cookieName = this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') || 'jid';
    await this.authService.revokeRefreshToken(userId, req.cookies[cookieName]);
    response.clearCookie(cookieName);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req): Omit<User, 'password'> {
    this.logger.log(`Profile access for user: ${req.user.email}`);
    return req.user;
  }

  @PublicRoute()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    this.logger.log(`Registration attempt for: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    this.logger.log(`Password change attempt for user ID: ${req.user.id}`);
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    // Get cookie configuration from config service
    const cookieName = this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') || 'jid';
    
    // Set HttpOnly cookie with refresh token
    response.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
} 