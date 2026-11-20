import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LeaveType } from '../../common/enums/leave-type.enum.js';

export class CreateLeaveDto {
  @ApiProperty({ enum: LeaveType })
  @IsEnum(LeaveType)
  type!: LeaveType;

  @ApiProperty({
    example: '2026-12-01',
    description: 'Must be tomorrow or later (Cairo time)',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2026-12-03',
    description: 'Not before the start date',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 'Family trip' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
