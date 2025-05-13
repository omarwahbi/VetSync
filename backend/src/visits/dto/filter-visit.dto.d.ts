import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class FilterVisitDto extends PaginationDto {
    startDate?: string;
    endDate?: string;
    visitType?: string;
    search?: string;
}
