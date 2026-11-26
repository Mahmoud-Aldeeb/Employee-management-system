import { describe, expect, it } from 'vitest';
import {
  inviteEmail,
  passwordResetEmail,
} from '../src/mail/email-templates.js';

const LINK = 'https://app.example.com/set-password#token=abc-123_XYZ';

describe('inviteEmail', () => {
  it('escapes the name and links to the set password page', () => {
    const { subject, html } = inviteEmail({
      firstName: '<b>Sara</b>',
      link: LINK,
    });

    expect(subject).toBe('Welcome to EMS - Set your password');
    expect(html).toContain('&lt;b&gt;Sara&lt;/b&gt;');
    expect(html).not.toContain('<b>Sara</b>');
    expect(html).toContain(`href="${LINK}"`);
    expect(html).toContain('48 hours');
  });
});

describe('passwordResetEmail', () => {
  it('links to the reset page and says how long it works', () => {
    const { subject, html } = passwordResetEmail({
      firstName: 'Sara',
      link: LINK,
    });

    expect(subject).toBe('Reset your EMS password');
    expect(html).toContain(`href="${LINK}"`);
    expect(html).toContain('1 hour');
    expect(html).toContain('you can ignore this email');
  });
});
