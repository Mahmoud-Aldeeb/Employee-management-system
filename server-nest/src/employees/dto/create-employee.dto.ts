import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { DEPARTMENTS } from '../../common/constants/departments.js';
import { Role } from '../../common/enums/role.enum.js';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Mona' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Hassan' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'mona.hassan@company.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '01000000000' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'Backend Engineer' })
  @IsString()
  @IsNotEmpty()
  position!: string;

  @ApiPropertyOptional({ enum: [...DEPARTMENTS], default: 'Engineering' })
  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: string;

  @ApiPropertyOptional({ type: Number, minimum: 0, example: 5000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, example: 500, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  allowances?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, example: 200, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deductions?: number;

  @ApiProperty({ example: '2026-01-15', description: 'ISO date' })
  @IsDateString()
  joinDate!: string;

  @ApiProperty({ minLength: 8, example: 'Temp#12345' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.EMPLOYEE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 'Joined from the platform team' })
  @IsOptional()
  @IsString()
  bio?: string;
}
