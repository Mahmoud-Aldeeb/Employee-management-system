import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LeaveStatus } from '../../common/enums/leave-status.enum.js';

export class UpdateLeaveStatusDto {
  @ApiProperty({ enum: LeaveStatus })
  @IsEnum(LeaveStatus)
  status!: LeaveStatus;
}
