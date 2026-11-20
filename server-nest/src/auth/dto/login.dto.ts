import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Secret#12345' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({
    enum: ['admin', 'employee'],
    description: 'Rejects the login when the account has a different role',
  })
  @IsOptional()
  @IsIn(['admin', 'employee'])
  role_type?: 'admin' | 'employee';
}
