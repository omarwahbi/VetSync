import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsPositive,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class AdminUserListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number = 10;
} 