import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto';
import { User } from '@prisma/client';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAllUsers(@Query() queryDto: AdminUserListQueryDto) {
    return this.usersService.findAllUsers(queryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findUserById(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateUser(
    @Param('id') id: string,
    @Body() updateDto: AdminUpdateUserDto
  ) {
    return this.usersService.updateUser(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id') id: string, @Req() request) {
    const adminId = (request.user as User).id;
    return this.usersService.deleteUser(id, adminId);
  }
}
