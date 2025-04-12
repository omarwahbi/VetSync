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
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilterVisitDto } from './dto/filter-visit.dto';

// Controller for visits under a specific pet
@Controller('pets/:petId/visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  create(
    @Body() createVisitDto: CreateVisitDto,
    @Param('petId') petId: string,
    @Request() req: { user: any },
  ) {
    return this.visitsService.create(createVisitDto, petId, req.user);
  }

  @Get()
  findAll(@Param('petId') petId: string, @Request() req: { user: any }) {
    return this.visitsService.findAll(petId, req.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Param('petId') petId: string,
    @Request() req: { user: any },
  ) {
    return this.visitsService.findOne(id, petId, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Param('petId') petId: string,
    @Body() updateVisitDto: UpdateVisitDto,
    @Request() req: { user: any },
  ) {
    return this.visitsService.update(id, petId, updateVisitDto, req.user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Param('petId') petId: string,
    @Request() req: { user: any },
  ) {
    return this.visitsService.remove(id, petId, req.user);
  }
}

// Controller for general visits endpoints
@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitsGlobalController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get('upcoming')
  findUpcoming(@Request() req: { user: any }) {
    return this.visitsService.findUpcoming(req.user);
  }

  @Get('all')
  findAllClinicVisits(
    @Request() req: { user: any },
    @Query() filterDto: FilterVisitDto,
  ) {
    return this.visitsService.findAllClinicVisits(req.user, filterDto);
  }
}
