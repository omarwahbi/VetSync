import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClinicUsersService } from './clinic-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClinicAdminGuard } from '../auth/guards/clinic-admin.guard';
import { ClinicCreateUserDto } from './dto/clinic-create-user.dto';
import { ClinicUpdateUserDto } from './dto/clinic-update-user.dto';
import { User } from '@prisma/client';
import { Request } from 'express';

// Custom request type with user 
interface RequestWithUser extends Request {
  user: User & { clinicId: string }; // Ensure clinicId is a string
}

@Controller('/dashboard/clinic-users')
export class ClinicUsersController {
  constructor(private readonly clinicUsersService: ClinicUsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: RequestWithUser) {
    return this.clinicUsersService.findUsersForClinic(req.user.clinicId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ClinicAdminGuard)
  createUser(
    @Req() req: RequestWithUser,
    @Body() createUserDto: ClinicCreateUserDto,
  ) {
    return this.clinicUsersService.createUserInClinic(req.user, createUserDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ClinicAdminGuard)
  updateUser(
    @Req() req: RequestWithUser,
    @Param('id') userIdToUpdate: string,
    @Body() updateDto: ClinicUpdateUserDto,
  ) {
    return this.clinicUsersService.updateUserInClinic(
      req.user,
      userIdToUpdate,
      updateDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ClinicAdminGuard)
  deleteUser(
    @Req() req: RequestWithUser,
    @Param('id') userIdToDelete: string,
  ) {
    return this.clinicUsersService.deleteUserInClinic(req.user, userIdToDelete);
  }
} 