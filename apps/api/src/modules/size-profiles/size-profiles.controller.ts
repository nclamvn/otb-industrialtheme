import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SizeProfilesService } from './size-profiles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  CreateSizeDefinitionDto,
  UpdateSizeDefinitionDto,
  CreateSizeProfileDto,
  UpdateSizeProfileDto,
  QuerySizeProfileDto,
  OptimizeSizeProfileDto,
} from './dto/size-profile.dto';

@ApiTags('size-profiles')
@ApiBearerAuth()
@Controller('size-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SizeProfilesController {
  constructor(private readonly service: SizeProfilesService) {}

  // ============ SIZE DEFINITIONS ============

  @Get('definitions')
  @ApiOperation({ summary: 'List all size definitions' })
  findAllDefinitions(
    @Query('sizeType') sizeType?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAllSizeDefinitions({
      sizeType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('definitions/:id')
  @ApiOperation({ summary: 'Get size definition by ID' })
  findOneDefinition(@Param('id') id: string) {
    return this.service.findOneSizeDefinition(id);
  }

  @Post('definitions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new size definition' })
  createDefinition(@Body() dto: CreateSizeDefinitionDto) {
    return this.service.createSizeDefinition(dto);
  }

  @Put('definitions/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update size definition' })
  updateDefinition(@Param('id') id: string, @Body() dto: UpdateSizeDefinitionDto) {
    return this.service.updateSizeDefinition(id, dto);
  }

  @Delete('definitions/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete size definition' })
  deleteDefinition(@Param('id') id: string) {
    return this.service.deleteSizeDefinition(id);
  }

  // ============ SIZE PROFILES ============

  @Get()
  @ApiOperation({ summary: 'List all size profiles' })
  findAll(@Query() query: QuerySizeProfileDto) {
    return this.service.findAllSizeProfiles(query);
  }

  @Get('breakdown/:categoryId')
  @ApiOperation({ summary: 'Get size breakdown for a category' })
  getSizeBreakdown(
    @Param('categoryId') categoryId: string,
    @Query('seasonId') seasonId?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.service.getSizeBreakdown(categoryId, { seasonId, locationId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get size profile by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOneSizeProfile(id);
  }

  @Post()
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Create new size profile' })
  create(@Body() dto: CreateSizeProfileDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.createSizeProfile(dto, user.id);
  }

  @Put(':id')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Update size profile' })
  update(@Param('id') id: string, @Body() dto: UpdateSizeProfileDto) {
    return this.service.updateSizeProfile(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Delete size profile' })
  remove(@Param('id') id: string) {
    return this.service.deleteSizeProfile(id);
  }

  // ============ OPTIMIZATION ============

  @Post('optimize')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Calculate optimal size profile' })
  optimize(@Body() dto: OptimizeSizeProfileDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.calculateOptimalProfile(dto, user.id);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple size profiles' })
  compare(@Body() body: { profileIds: string[] }) {
    return this.service.compareProfiles(body.profileIds);
  }
}
