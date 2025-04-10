import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  create(@Body() createOwnerDto: CreateOwnerDto, @Request() req) {
    return this.ownersService.create(createOwnerDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.ownersService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ownersService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOwnerDto: UpdateOwnerDto,
    @Request() req,
  ) {
    return this.ownersService.update(id, updateOwnerDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.ownersService.remove(id, req.user);
  }
}
