import { IsEnum } from 'class-validator';
import { LeaveStatus } from '../../common/enums/leave-status.enum.js';

export class UpdateLeaveStatusDto {
  @IsEnum(LeaveStatus)
  status!: LeaveStatus;
}
