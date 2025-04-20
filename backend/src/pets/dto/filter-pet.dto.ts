import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
 
export class FilterPetDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
} 