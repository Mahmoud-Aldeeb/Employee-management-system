import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from './utils/test-app.js';

interface OpenApiDocument {
  openapi: string;
  paths: Record<
    string,
    Record<string, { security?: unknown[]; tags?: string[] }>
  >;
  components: {
    schemas: Record<string, { required?: string[] }>;
    securitySchemes: Record<string, { type: string; in: string; name: string }>;
  };
}

describe('OpenAPI documentation', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let document: OpenApiDocument;

  beforeAll(async () => {
    ctx = await createTestContext();
    const res = await request(ctx.server).get('/api/docs-json');
    document = res.body as OpenApiDocument;
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('describes every module under the /api prefix', () => {
    expect(document.openapi).toMatch(/^3\./);

    for (const path of [
      '/api/auth/login',
      '/api/employees',
      '/api/attendance',
      '/api/leave',
      '/api/payslips',
      '/api/dashboard',
      '/api/analytics',
      '/api/profile/salary',
      '/api/health',
      '/api/demo/login',
    ]) {
      expect(document.paths, path).toHaveProperty([path]);
    }
  });

  it('documents the request bodies', () => {
    expect(document.components.schemas.LoginDto.required).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
    const required = document.components.schemas.CreateEmployeeDto.required;
    expect(required).toEqual(
      expect.arrayContaining(['firstName', 'email', 'joinDate']),
    );
    expect(required).not.toContain('password');
    expect(document.components.schemas).toHaveProperty(['UpdateEmployeeDto']);
  });

  it('marks protected routes as cookie authenticated and public ones as open', () => {
    expect(document.components.securitySchemes.cookie).toMatchObject({
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    });
    expect(document.paths['/api/employees'].get.security).toEqual([
      { cookie: [] },
    ]);
    expect(document.paths['/api/health'].get.security).toBeUndefined();
  });
});
