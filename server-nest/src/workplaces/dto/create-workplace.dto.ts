import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_RADIUS_M,
  MAX_RADIUS_M,
  MIN_RADIUS_M,
} from '../schemas/workplace.schema.js';

export class CreateWorkplaceDto {
  @ApiProperty({ example: 'Main Office' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 30.0444, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 31.2357, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({
    default: DEFAULT_RADIUS_M,
    minimum: MIN_RADIUS_M,
    maximum: MAX_RADIUS_M,
    description: 'Allowed distance from the point, in meters',
  })
  @IsOptional()
  @IsNumber()
  @Min(MIN_RADIUS_M)
  @Max(MAX_RADIUS_M)
  radiusMeters?: number;
}
