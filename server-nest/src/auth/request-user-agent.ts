import type { Request } from 'express';

export function userAgentOf(request: Request) {
  return request.get('user-agent')?.slice(0, 200);
}
