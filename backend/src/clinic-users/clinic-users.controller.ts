import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClinicUsersService } from './clinic-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClinicAdminGuard } from '../auth/guards/clinic-admin.guard';
import { ClinicCreateUserDto } from './dto/clinic-create-user.dto';

@Controller('/dashboard/clinic-users')
export class ClinicUsersController {
  constructor(private readonly clinicUsersService: ClinicUsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req) {
    return this.clinicUsersService.findUsersForClinic(req.user.clinicId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ClinicAdminGuard)
  createUser(@Req() req, @Body() createUserDto: ClinicCreateUserDto) {
    return this.clinicUsersService.createUserInClinic(req.user, createUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ClinicAdminGuard)
  deleteUser(@Req() req, @Param('id') userIdToDelete: string) {
    return this.clinicUsersService.deleteUserInClinic(req.user, userIdToDelete);
  }
} 