import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'react-hot-toast';
import { afterEach, describe, expect, it } from 'vitest';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { router } from '../mocks/navigation';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

function renderForm(mode: 'reset' | 'set', token = 'tok-123') {
  window.location.hash = token ? `#token=${token}` : '';
  return renderWithClient(
    <>
      <ResetPasswordForm mode={mode} />
      <Toaster />
    </>,
  );
}

describe('ResetPasswordForm', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('explains an incomplete link and offers a new one', () => {
    renderForm('reset', '');

    expect(screen.getByRole('heading', { name: 'This link cannot be used' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('uses the right wording for a reset and for an invitation', () => {
    const { unmount } = renderForm('reset');
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update password' })).toBeInTheDocument();
    unmount();

    renderForm('set');
    expect(screen.getByRole('heading', { name: 'Welcome! Set your password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set password' })).toBeInTheDocument();
  });

  it('validates the length before calling the API', async () => {
    const user = userEvent.setup();
    renderForm('reset');

    await user.type(screen.getByLabelText('New password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument();
  });

  it('sets the password with the token and opens the right portal', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post('/api/auth/reset-password', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, portal: 'employee' });
      }),
    );
    renderForm('set');

    await user.type(screen.getByLabelText('New password'), 'Chosen#12345');
    await user.click(screen.getByRole('button', { name: 'Set password' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login/employee'));
    expect(body).toEqual({ token: 'tok-123', newPassword: 'Chosen#12345' });
  });

  it('explains an expired link and offers a new one', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/reset-password', () =>
        HttpResponse.json({ error: 'This link is invalid or has expired' }, { status: 400 }),
      ),
    );
    renderForm('reset');

    await user.type(screen.getByLabelText('New password'), 'Chosen#12345');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('heading', { name: 'This link cannot be used' })).toBeInTheDocument();
    expect(screen.getByText('This link is invalid or has expired')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('keeps the form and shows a message when the server fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/reset-password', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 }),
      ),
    );
    renderForm('reset');

    await user.type(screen.getByLabelText('New password'), 'Chosen#12345');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update password' })).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });
});