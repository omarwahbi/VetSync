import {
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
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
}
