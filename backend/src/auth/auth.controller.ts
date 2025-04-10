import { Controller, Post, UseGuards, Request, Get, Body, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PublicRoute } from './public.decorator';
import { RegisterDto, TokenResponseDto } from './dto/auth.dto';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @PublicRoute()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req): Promise<TokenResponseDto> {
    this.logger.log(`Login attempt for user: ${req.user.email}`);
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req): Omit<User, 'password'> {
    this.logger.log(`Profile access for user: ${req.user.email}`);
    return req.user;
  }

  @PublicRoute()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    this.logger.log(`Registration attempt for: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }
} 