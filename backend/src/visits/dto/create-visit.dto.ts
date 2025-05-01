import {
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVisitDto {
  @IsDateString()
  @IsOptional()
  visitDate?: string;

  @IsString()
  @IsNotEmpty()
  visitType: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsDateString()
  @IsOptional()
  nextReminderDate?: string;

  @IsBoolean()
  @IsOptional()
  isReminderEnabled?: boolean;

  @IsNumber({}, { message: 'Temperature must be a number' })
  @IsOptional()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  temperature?: number;

  @IsNumber({}, { message: 'Weight must be a number' })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsString()
  @IsOptional()
  @IsIn(['kg', 'lb'])
  weightUnit?: string;

  @IsInt({ message: 'Heart rate must be an integer' })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  heartRate?: number;

  @IsInt({ message: 'Respiratory rate must be an integer' })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  respiratoryRate?: number;
}
