import { Injectable } from '@nestjs/common';
import { Inngest } from 'inngest';

@Injectable()
export class InngestService {
  readonly client = new Inngest({ id: 'fullstack-ems' });

  send(name: string, data: Record<string, unknown>) {
    return this.client.send({ name, data });
  }
}
