import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilterPetDto } from './dto/filter-pet.dto';

// Controller for top-level pets routes
@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsTopLevelController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  findAllClinicPets(
    @Query() filterPetDto: FilterPetDto,
    @Request() req: { user: any },
  ) {
    return this.petsService.findAllClinicPets(req.user, filterPetDto);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() req: { user: any },
  ) {
    return this.petsService.findOneByPetId(id, req.user);
  }
}

// Controller for nested pets routes under owners
@Controller('owners/:ownerId/pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  create(
    @Body() createPetDto: CreatePetDto,
    @Param('ownerId') ownerId: string,
    @Request() req: { user: any },
  ) {
    return this.petsService.create(createPetDto, ownerId, req.user);
  }

  @Get()
  findAll(@Param('ownerId') ownerId: string, @Request() req: { user: any }) {
    return this.petsService.findAll(ownerId, req.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Param('ownerId') ownerId: string,
    @Request() req: { user: any },
  ) {
    return this.petsService.findOne(id, ownerId, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Param('ownerId') ownerId: string,
    @Body() updatePetDto: UpdatePetDto,
    @Request() req: { user: any },
  ) {
    return this.petsService.update(id, ownerId, updatePetDto, req.user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Param('ownerId') ownerId: string,
    @Request() req: { user: any },
  ) {
    return this.petsService.remove(id, ownerId, req.user);
  }
}
