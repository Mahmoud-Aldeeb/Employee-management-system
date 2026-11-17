import { IsIn, IsOptional } from 'class-validator';
import { DEPARTMENTS } from '../../common/constants/departments.js';

export class ListEmployeesQueryDto {
  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: string;
}
