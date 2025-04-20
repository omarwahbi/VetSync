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
import { User } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Response, Request as ExpressRequest } from 'express';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @PublicRoute()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Req() req,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ access_token: string }> {
    this.logger.log(`Login attempt for user: ${req.user.email}`);
    
    // Get tokens from auth service
    const tokens = await this.authService.login(req.user);
    
    // Get cookie configuration from config service
    const cookieName = this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') || 'jid';
    
    // Set HttpOnly cookie with refresh token
    response.cookie(cookieName, tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    // Return only the access token in the response body
    return { access_token: tokens.access_token };
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
      
      // Step 2: Validate token in DB and check subscription
      const user = await this.authService.validateRefreshTokenAndSubscription(userId, providedRefreshToken);
      
      // Generate new access token
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
      
      this.logger.log(`New access token generated for user ID: ${userId}`);
      
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
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ message: string }> {
    const userId = request.user?.id;
    this.logger.log(`Logout requested for user ID: ${userId}`);
    
    // Get cookie name from config
    const cookieName = this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') || 'jid';
    
    // Remove refresh token from database
    await this.authService.removeRefreshToken(userId);
    
    // Clear the cookie
    response.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
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
} 