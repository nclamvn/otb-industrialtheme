import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WSSIService } from './wssi.service';
import { CreateWSSIDto } from './dto/create-wssi.dto';
import { UpdateWSSIDto } from './dto/update-wssi.dto';
import { QueryWSSIDto, WSSISummaryQueryDto } from './dto/query-wssi.dto';
import { ReforecastDto, BulkReforecastDto } from './dto/reforecast.dto';
import { CreateThresholdDto, UpdateThresholdDto } from './dto/threshold.dto';

@Controller('wssi')
@UseGuards(JwtAuthGuard)
export class WSSIController {
  constructor(private readonly wssiService: WSSIService) {}

  @Get()
  async findAll(@Query() query: QueryWSSIDto) {
    return this.wssiService.findAll(query);
  }

  @Get('summary')
  async getSummary(@Query() query: WSSISummaryQueryDto) {
    return this.wssiService.getSummary(query);
  }

  @Get('alerts')
  async getAlerts(
    @Query('divisionId') divisionId?: string,
    @Query('brandId') brandId?: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('severity') severity?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.wssiService.getAlerts({
      divisionId,
      brandId,
      acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
      severity,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.wssiService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateWSSIDto, @Request() req: any) {
    return this.wssiService.create(dto, req.user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWSSIDto) {
    return this.wssiService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.wssiService.remove(id);
  }

  @Post('reforecast')
  async reforecast(@Body() dto: ReforecastDto, @Request() req: any) {
    return this.wssiService.reforecast(dto, req.user.id);
  }

  @Post('bulk-reforecast')
  async bulkReforecast(@Body() dto: BulkReforecastDto, @Request() req: any) {
    return this.wssiService.bulkReforecast(dto, req.user.id);
  }

  @Patch('alerts/:alertId/acknowledge')
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ) {
    return this.wssiService.acknowledgeAlert(alertId, req.user.id, notes);
  }

  // Threshold endpoints
  @Get('thresholds')
  async getThresholds(
    @Query('divisionId') divisionId?: string,
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.wssiService.getThresholds({
      divisionId,
      brandId,
      categoryId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('thresholds/:id')
  async getThreshold(@Param('id') id: string) {
    return this.wssiService.getThreshold(id);
  }

  @Post('thresholds')
  async createThreshold(@Body() dto: CreateThresholdDto) {
    return this.wssiService.createThreshold(dto);
  }

  @Put('thresholds/:id')
  async updateThreshold(@Param('id') id: string, @Body() dto: UpdateThresholdDto) {
    return this.wssiService.updateThreshold(id, dto);
  }

  @Delete('thresholds/:id')
  async deleteThreshold(@Param('id') id: string) {
    return this.wssiService.deleteThreshold(id);
  }
}
