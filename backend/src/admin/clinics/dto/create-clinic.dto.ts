import { IsBoolean, IsISO8601, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClinicDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = false;

  @IsBoolean()
  @IsOptional()
  canSendReminders?: boolean = false;

  @IsISO8601()
  @IsOptional()
  subscriptionEndDate?: string;
} 