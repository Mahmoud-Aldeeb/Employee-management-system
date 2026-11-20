import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    maxLength: 500,
    example: 'Frontend engineer who loves clean UI.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
