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
import { DivisionsService } from './divisions.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('master-data')
@ApiBearerAuth()
@Controller('divisions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all divisions' })
  findAll(@Query() query: any) {
    return this.divisionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get division by ID' })
  findOne(@Param('id') id: string) {
    return this.divisionsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new division' })
  create(@Body() data: any) {
    return this.divisionsService.create(data);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update division' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.divisionsService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete division' })
  remove(@Param('id') id: string) {
    return this.divisionsService.remove(id);
  }
}
