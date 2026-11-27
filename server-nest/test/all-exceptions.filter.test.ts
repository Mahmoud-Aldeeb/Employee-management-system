import { BadRequestException, type ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { LocationException } from '../src/attendance/location/location-exception.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';

function run(exception: unknown) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  new AllExceptionsFilter().catch(exception, host);
  return { status, json };
}

describe('AllExceptionsFilter', () => {
  it('keeps the plain error shape', () => {
    const { status, json } = run(new BadRequestException('Nope'));

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Nope' });
  });

  it('joins validation messages', () => {
    const { json } = run(new BadRequestException(['a is wrong', 'b is wrong']));

    expect(json).toHaveBeenCalledWith({ error: 'a is wrong, b is wrong' });
  });

  it('adds the code when the exception has one', () => {
    const { status, json } = run(
      new LocationException(
        403,
        'OUTSIDE_WORKPLACE',
        'You are 1.1 km from Main Office (allowed 150 m).',
      ),
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      error: 'You are 1.1 km from Main Office (allowed 150 m).',
      code: 'OUTSIDE_WORKPLACE',
    });
  });
});
