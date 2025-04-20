import { Body, Controller, Logger, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateOwnProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    this.logger.log(`User ${req.user.id} is updating their profile`);
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
} 