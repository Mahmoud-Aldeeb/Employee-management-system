import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';
import { DEPARTMENTS } from '../../common/constants/departments.js';

export class TeamCalendarQueryDto {
  @ApiPropertyOptional({
    example: '2026-12',
    description:
      'Month formatted as YYYY-MM; defaults to the current month in Cairo',
  })
  @IsOptional()
  @Matches(/^20\d{2}-(0[1-9]|1[0-2])$/, {
    message: 'month must be formatted as YYYY-MM',
  })
  month?: string;

  @ApiPropertyOptional({
    enum: [...DEPARTMENTS],
    description: 'Admins only; employees always see their own department',
  })
  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: string;
}
