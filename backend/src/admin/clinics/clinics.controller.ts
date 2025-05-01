import { Body, Controller, Get, Param, Patch, Post, UseGuards, HttpCode, HttpStatus, Query, Request } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { UpdateClinicSettingsDto } from './dto/update-clinic-settings.dto';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AdminClinicListQueryDto } from './dto/admin-clinic-list-query.dto';

@Controller('admin/clinics')
@UseGuards(AdminGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createClinic(@Body() createClinicDto: CreateClinicDto, @Request() req) {
    return this.clinicsService.createClinic(createClinicDto, req.user);
  }

  @Get()
  findAllClinics(@Query() queryDto: AdminClinicListQueryDto) {
    return this.clinicsService.findAllClinics(queryDto);
  }

  @Get(':id')
  findClinicById(@Param('id') id: string) {
    return this.clinicsService.findClinicById(id);
  }

  @Patch(':id')
  updateClinicSettings(
    @Param('id') id: string,
    @Body() updateClinicSettingsDto: UpdateClinicSettingsDto,
    @Request() req,
  ) {
    return this.clinicsService.updateClinicSettings(id, updateClinicSettingsDto, req.user);
  }
}
