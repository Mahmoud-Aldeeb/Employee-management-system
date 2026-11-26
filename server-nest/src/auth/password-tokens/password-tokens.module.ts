import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordToken, PasswordTokenSchema } from './password-token.schema.js';
import { PasswordTokensService } from './password-tokens.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PasswordToken.name, schema: PasswordTokenSchema },
    ]),
  ],
  providers: [PasswordTokensService],
  exports: [PasswordTokensService],
})
export class PasswordTokensModule {}
