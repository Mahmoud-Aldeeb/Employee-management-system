import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import bcrypt from 'bcrypt';
import { AppModule } from './app.module.js';
import { Role } from './common/enums/role.enum.js';
import { UsersService } from './users/users.service.js';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const config = app.get(ConfigService);
  const users = app.get(UsersService);

  const email = config.get<string>('ADMIN_EMAIL');
  const password = config.get<string>('ADMIN_PASSWORD');

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    await app.close();
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  const existing = await users.findByEmailWithPassword(email);

  if (!existing) {
    await users.create({ email, password: hashed, role: Role.ADMIN });
    console.log(`Admin created: ${email}`);
  } else if (process.argv.includes('--reset')) {
    await users.updatePassword(existing.id, hashed);
    console.log(`Password reset for: ${email}`);
  } else {
    console.log(
      `User already exists with role ${existing.role}. Use --reset to change the password.`,
    );
  }

  await app.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
