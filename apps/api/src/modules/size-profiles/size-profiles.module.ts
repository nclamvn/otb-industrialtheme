import { Module } from '@nestjs/common';
import { SizeProfilesController } from './size-profiles.controller';
import { SizeProfilesService } from './size-profiles.service';

@Module({
  controllers: [SizeProfilesController],
  providers: [SizeProfilesService],
  exports: [SizeProfilesService],
})
export class SizeProfilesModule {}
