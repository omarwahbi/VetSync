import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class AdminClinicListQueryDto extends PaginationDto {
    search?: string;
    isActive?: boolean;
}
