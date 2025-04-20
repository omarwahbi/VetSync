import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { RegisterDto, TokenResponseDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

type UserWithoutPassword = Omit<User, 'password'>;

interface JwtPayload {
  username: string;
  sub: string;
  clinicId?: string | null;
  role: UserRole;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    this.logger.debug(`Attempting to validate user: ${email}`);
    
    const user = await this.prisma.user.findUnique({
      where: { email },
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

    // Exclude password from returned user object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    this.logger.debug(`User validated successfully: ${email}`);
    return result;
  }

  async login(user: UserWithoutPassword): Promise<TokenResponseDto> {
    this.logger.debug(`Generating JWT token for user: ${user.email}`);
    
    const payload: JwtPayload = {
      username: user.email,
      sub: user.id,
      clinicId: user.clinicId,
      role: user.role
    };

    const access_token = this.jwtService.sign(payload);
    
    this.logger.debug(`JWT token generated successfully for user: ${user.email}`);
    return {
      access_token,
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

  async register(data: RegisterDto): Promise<UserWithoutPassword> {
    this.logger.debug(`Attempting to register user: ${data.email}`);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      this.logger.error(`Registration failed: User already exists: ${data.email}`);
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
          email: data.email,
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