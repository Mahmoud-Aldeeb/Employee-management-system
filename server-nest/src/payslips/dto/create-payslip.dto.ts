import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreatePayslipDto {
  @ApiProperty({ example: '64b7f0c2e1d3a4b5c6d7e8f9' })
  @IsMongoId()
  employeeId!: string;

  @ApiProperty({ minimum: 1, maximum: 12, example: 11 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ minimum: 2000, maximum: 2100, example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Defaults to the current salary',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Defaults to the current salary',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  allowances?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Defaults to the current salary',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deductions?: number;
}
