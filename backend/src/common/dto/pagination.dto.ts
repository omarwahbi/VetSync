import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number) // Transform query param string to number
  @IsInt()
  @Min(1)
  page?: number = 1; // Default to page 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Set a reasonable max limit
  limit?: number = 20; // Default limit
} 