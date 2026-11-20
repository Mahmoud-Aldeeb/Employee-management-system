import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { Connection } from 'mongoose';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
import { buildDemoDataset } from './demo-dataset.js';
import { DemoDataStore } from './demo-data.store.js';
import {
  DEMO_ADMIN_EMAIL,
  DEMO_EMPLOYEE_EMAIL,
  type DemoRole,
} from './demo.constants.js';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly store: DemoDataStore,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  isEnabled() {
    return this.config.get<boolean>('DEMO_MODE') === true;
  }

  async ensureSeeded() {
    const admin = await this.users.findByEmail(DEMO_ADMIN_EMAIL);
    if (!admin) await this.reset();
  }

  async reset() {
    const passwordHash = await bcrypt.hash(randomUUID(), 10);
    const dataset = buildDemoDataset({ now: new Date(), passwordHash });
    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        await this.store.clear(session);
        await this.store.insert(dataset, session);
      });
    } finally {
      await session.endSession();
    }

    this.logger.log(`Demo data reset: ${dataset.employees.length} employees`);
    return { employees: dataset.employees.length };
  }

  async findAccount(role: DemoRole): Promise<JwtPayload> {
    const email = role === 'admin' ? DEMO_ADMIN_EMAIL : DEMO_EMPLOYEE_EMAIL;
    const user = await this.users.findByEmail(email);
    if (!user)
      throw new ServiceUnavailableException('Demo data is not available');

    return { id: user.id, email: user.email, role: user.role };
  }
}
