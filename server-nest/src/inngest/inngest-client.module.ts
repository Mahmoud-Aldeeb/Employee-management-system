import { Module } from '@nestjs/common';
import { InngestService } from './inngest.service.js';

@Module({
  providers: [InngestService],
  exports: [InngestService],
})
export class InngestClientModule {}
