import {
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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

  @IsDateString()
  @IsOptional()
  nextReminderDate?: string;

  @IsBoolean()
  @IsOptional()
  isReminderEnabled?: boolean;
}
