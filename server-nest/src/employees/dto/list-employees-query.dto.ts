import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { DEPARTMENTS } from '../../common/constants/departments.js';

export class ListEmployeesQueryDto {
  @ApiPropertyOptional({ enum: [...DEPARTMENTS] })
  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: string;
}
