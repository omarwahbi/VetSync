import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterVisitDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  visitType?: string;

  @IsOptional()
  @IsString()
  search?: string;
} 