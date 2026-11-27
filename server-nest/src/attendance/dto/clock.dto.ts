import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class LocationSampleDto {
  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({
    description: 'Accuracy radius in meters reported by the device',
  })
  @IsNumber()
  @Min(0)
  @Max(100_000)
  accuracy!: number;

  @ApiProperty({
    description: 'When the device took the reading (epoch milliseconds)',
  })
  @IsInt()
  @Min(0)
  capturedAt!: number;
}

export class ClockDto {
  @ApiPropertyOptional({ type: LocationSampleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationSampleDto)
  location?: LocationSampleDto;
}
