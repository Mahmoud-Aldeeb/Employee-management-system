import { IsEnum, IsOptional } from 'class-validator';
import { LeaveStatus } from '../../common/enums/leave-status.enum.js';

export class ListLeavesQueryDto {
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;
}
