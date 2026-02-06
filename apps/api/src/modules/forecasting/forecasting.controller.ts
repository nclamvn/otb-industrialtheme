import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ForecastingService } from './forecasting.service';
import { CreateForecastRunDto, CreateForecastConfigDto } from './dto/create-forecast.dto';

@ApiTags('Forecasting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('forecasting')
export class ForecastingController {
  constructor(private readonly forecastingService: ForecastingService) {}

  // ==================== Forecast Config ====================

  @Post('configs')
  @ApiOperation({ summary: 'Create a forecast configuration' })
  @ApiResponse({ status: 201, description: 'Config created' })
  async createConfig(@Body() dto: CreateForecastConfigDto) {
    return this.forecastingService.createConfig(dto);
  }

  @Get('configs')
  @ApiOperation({ summary: 'Get forecast configurations' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  async getConfigs(
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.forecastingService.getConfigs({
      brandId,
      categoryId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Put('configs/:id')
  @ApiOperation({ summary: 'Update a forecast configuration' })
  async updateConfig(@Param('id') id: string, @Body() dto: Partial<CreateForecastConfigDto>) {
    return this.forecastingService.updateConfig(id, dto);
  }

  // ==================== Forecast Runs ====================

  @Post('run')
  @ApiOperation({ summary: 'Run a new forecast' })
  @ApiResponse({ status: 201, description: 'Forecast generated' })
  async runForecast(@Body() dto: CreateForecastRunDto, @Request() req: { user: { id: string } }) {
    return this.forecastingService.runForecast(dto, req.user.id);
  }

  @Get('runs')
  @ApiOperation({ summary: 'Get forecast run history' })
  @ApiQuery({ name: 'seasonId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getForecastRuns(
    @Query('seasonId') seasonId?: string,
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.forecastingService.getForecastRuns({
      seasonId,
      brandId,
      categoryId,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get forecast run by ID' })
  async getForecastRunById(@Param('id') id: string) {
    return this.forecastingService.getForecastRunById(id);
  }

  // ==================== Method Comparison ====================

  @Post('compare-methods')
  @ApiOperation({ summary: 'Compare different forecasting methods' })
  @ApiResponse({ status: 200, description: 'Method comparison results' })
  async compareMethods(
    @Body()
    params: {
      seasonId?: string;
      brandId?: string;
      categoryId?: string;
      lookbackWeeks?: number;
      forecastWeeks?: number;
    },
  ) {
    return this.forecastingService.compareMethods(params);
  }
}
