import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateClinicProfileDto {
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
} 