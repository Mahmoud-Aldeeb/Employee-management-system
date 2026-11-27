import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module.js';
import { Workplace, WorkplaceSchema } from './schemas/workplace.schema.js';
import { WorkplacesController } from './workplaces.controller.js';
import { WorkplacesService } from './workplaces.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workplace.name, schema: WorkplaceSchema },
    ]),
    AuditModule,
  ],
  controllers: [WorkplacesController],
  providers: [WorkplacesService],
  exports: [WorkplacesService],
})
export class WorkplacesModule {}
