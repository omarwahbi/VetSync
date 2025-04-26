import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class AdminUpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  clinicId?: string | null;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;
} 