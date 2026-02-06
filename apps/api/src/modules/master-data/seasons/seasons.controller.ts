import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeasonsService } from './seasons.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('master-data')
@ApiBearerAuth()
@Controller('seasons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get()
  @ApiOperation({ summary: 'List all seasons' })
  findAll(@Query() query: any) {
    return this.seasonsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get season by ID' })
  findOne(@Param('id') id: string) {
    return this.seasonsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new season' })
  create(@Body() data: any) {
    return this.seasonsService.create(data);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update season' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.seasonsService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete season' })
  remove(@Param('id') id: string) {
    return this.seasonsService.remove(id);
  }
}
