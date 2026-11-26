import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { configureApp } from '../../src/app.setup.js';
import { Role } from '../../src/common/enums/role.enum.js';
import { InngestService } from '../../src/inngest/inngest.service.js';
import { UsersService } from '../../src/users/users.service.js';
import { MailService } from '../../src/mail/mail.service.js';

export interface InngestEvent {
  name: string;
  data: Record<string, unknown>;
}

export interface SentMail {
  to: string;
  subject: string;
  html: string;
  kind: 'account' | 'reminder';
}

export interface TestContextOptions {
  demoMode?: boolean;
}

export async function createTestContext(options: TestContextOptions = {}) {
  const mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [{ launchTimeout: 60_000 }],
  });
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URL = mongod.getUri('ems-test');
  process.env.JWT_SECRET = 'test-access-secret-0123456789-abcdefghij';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789-abcdefghij';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.DEMO_MODE = String(options.demoMode ?? false);

  const { AppModule } = await import('../../src/app.module.js');

  const events: InngestEvent[] = [];
  const fakeInngest = {
    client: {},
    send: async (name: string, data: Record<string, unknown>) => {
      events.push({ name, data });
    },
  };

  const mails: SentMail[] = [];
  const fakeMail = {
    send: async (mail: SentMail) => {
      mails.push(mail);
    },
  };

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(InngestService)
    .useValue(fakeInngest)
    .overrideProvider(MailService)
    .useValue(fakeMail)
    .compile();

  const app: INestApplication = moduleRef.createNestApplication({
    bodyParser: false,
  });
  configureApp(app);
  await app.init();

  const connection = app.get<Connection>(getConnectionToken());
  await Promise.all(
    Object.values(connection.models).map((model) => model.init()),
  );

  const server = app.getHttpServer();

  async function createUser(email: string, password: string, role: Role) {
    const hashed = await bcrypt.hash(password, 4);
    await app.get(UsersService).create({ email, password: hashed, role });
  }

  async function login(
    email: string,
    password: string,
    roleType?: 'admin' | 'employee',
  ) {
    const agent = request.agent(server);
    const res = await agent
      .post('/api/auth/login')
      .send({ email, password, ...(roleType ? { role_type: roleType } : {}) });
    if (res.status !== 200) {
      throw new Error(
        `Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`,
      );
    }
    return agent;
  }

  async function close() {
    await app.close();
    await mongod.stop();
  }

  return { app, server, events, mails, createUser, login, close };
}
