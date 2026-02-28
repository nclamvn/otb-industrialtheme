import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { DataRetentionService } from './data-retention.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('data-retention')
@UseGuards(JwtAuthGuard)
export class DataRetentionController {
  constructor(private readonly dataRetentionService: DataRetentionService) {}

  @Get('status')
  getStatus() {
    return this.dataRetentionService.getRetentionStatus();
  }

  @Post('purge')
  purge() {
    return this.dataRetentionService.purgeExpiredData();
  }

  @Post('anonymize/:userId')
  anonymizeUser(@Param('userId') userId: string) {
    return this.dataRetentionService.anonymizeUser(userId);
  }

  @Get('export/:userId')
  exportUserData(@Param('userId') userId: string) {
    return this.dataRetentionService.exportUserData(userId);
  }
}
