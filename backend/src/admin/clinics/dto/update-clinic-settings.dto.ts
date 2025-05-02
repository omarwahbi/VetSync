import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateClinicSettingsDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  canSendReminders?: boolean;

  @IsDateString()
  @IsOptional()
  subscriptionStartDate?: string;

  @IsDateString()
  @IsOptional()
  subscriptionEndDate?: string;

  @IsInt()
  @Min(-1)
  @IsOptional()
  reminderMonthlyLimit?: number;
} 