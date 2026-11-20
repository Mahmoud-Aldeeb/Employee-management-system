import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

export type DependencyState = 'up' | 'down';

export interface HealthReport {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  checks: { database: DependencyState };
}

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async check(): Promise<HealthReport> {
    const database = await this.pingDatabase();

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database },
    };
  }

  private async pingDatabase(): Promise<DependencyState> {
    const db = this.connection.db;
    if (!db) return 'down';

    try {
      await db.command({ ping: 1 });
      return 'up';
    } catch {
      return 'down';
    }
  }
}
