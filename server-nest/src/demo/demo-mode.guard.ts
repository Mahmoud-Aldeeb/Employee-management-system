import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { DemoService } from './demo.service.js';

@Injectable()
export class DemoModeGuard implements CanActivate {
  constructor(private readonly demo: DemoService) {}

  canActivate() {
    if (!this.demo.isEnabled())
      throw new NotFoundException('Demo mode is disabled');
    return true;
  }
}
