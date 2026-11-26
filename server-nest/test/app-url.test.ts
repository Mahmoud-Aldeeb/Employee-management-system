import { describe, expect, it } from 'vitest';
import { buildAppUrl } from '../src/common/utils/app-url.js';

describe('buildAppUrl', () => {
  it('appends the path to a single origin', () => {
    expect(buildAppUrl('https://app.example.com', '/reset-password')).toBe(
      'https://app.example.com/reset-password',
    );
  });

  it('uses the first origin and drops trailing slashes', () => {
    expect(
      buildAppUrl(
        'https://app.example.com/, https://other.example.com',
        '/set-password',
      ),
    ).toBe('https://app.example.com/set-password');
  });
});
