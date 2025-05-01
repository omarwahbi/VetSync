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
  
  @Get('due-today')
  findVisitsDueToday(
    @Request() req: { user: any },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.visitsService.findVisitsDueToday(
      req.user,
      page ? +page : undefined,
      limit ? +limit : undefined,
    );
  }

  @Get('debug-dates')
  async debugDates() {
    // Get the current date in various formats for comparison
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Use the service to get the debug data
    const visits = await this.visitsService.getDebugDateInfo();
    
    // Additional useful date information for debugging
    const debugInfo = {
      currentServerTime: now.toISOString(),
      todayDateOnly: today,
      todayStart: `${today}T00:00:00.000Z`,
      todayEnd: `${today}T23:59:59.999Z`,
      visits: visits.map(v => ({
        id: v.id,
        visitType: v.visitType,
        petId: v.petId,
        petName: v.pet?.name,
        clinicId: v.pet?.owner?.clinicId,
        nextReminderDate: v.nextReminderDate?.toISOString(),
        isToday: v.nextReminderDate
          ? v.nextReminderDate.toISOString().startsWith(today)
          : false,
      })),
    };
    
    return debugInfo;
  }
}
