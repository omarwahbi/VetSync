import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ClinicProfileService } from './clinic-profile.service';
import { UpdateClinicProfileDto } from './dto/update-clinic-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clinic-profile')
@UseGuards(JwtAuthGuard)
export class ClinicProfileController {
  constructor(private readonly clinicProfileService: ClinicProfileService) {}

  @Get()
  getClinicProfile(@Request() req: { user: any }) {
    return this.clinicProfileService.getClinicProfile(req.user);
  }

  @Patch()
  updateClinicProfile(
    @Request() req: { user: any },
    @Body() updateClinicProfileDto: UpdateClinicProfileDto,
  ) {
    return this.clinicProfileService.updateClinicProfile(
      req.user,
      updateClinicProfileDto,
    );
  }
}
