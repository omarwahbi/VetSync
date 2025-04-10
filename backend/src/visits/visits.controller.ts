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
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
