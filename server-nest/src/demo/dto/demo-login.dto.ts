import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { DemoRole } from '../demo.constants.js';

export class DemoLoginDto {
  @ApiProperty({ enum: ['admin', 'employee'], example: 'admin' })
  @IsIn(['admin', 'employee'])
  role!: DemoRole;
}
