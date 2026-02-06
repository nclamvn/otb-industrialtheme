import { Module, Global } from '@nestjs/common';
import { BatchProcessorService } from './batch-processor.service';

@Global()
@Module({
  providers: [BatchProcessorService],
  exports: [BatchProcessorService],
})
export class BatchModule {}
