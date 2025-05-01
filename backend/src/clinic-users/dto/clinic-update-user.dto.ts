import {
  IsString,
  IsOptional,
  MinLength,
  IsBoolean,
  IsEnum,
  IsIn,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class ClinicUpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  lastName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(UserRole)
  @IsOptional()
  @IsIn([UserRole.CLINIC_ADMIN])
  role?: UserRole;
} 