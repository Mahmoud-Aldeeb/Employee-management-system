import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'react-hot-toast';
import { describe, expect, it } from 'vitest';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

function renderForm() {
  return renderWithClient(
    <>
      <ForgotPasswordForm />
      <Toaster />
    </>,
  );
}

describe('ForgotPasswordForm', () => {
  it('validates the email before calling the API', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('sends the email and confirms without promising that the account exists', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post('/api/auth/forgot-password', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    renderForm();

    await user.type(screen.getByLabelText('Work email'), 'sara@test.local');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByText(/If an account exists for/)).toBeInTheDocument();
    expect(screen.getByText('sara@test.local')).toBeInTheDocument();
    expect(body).toEqual({ email: 'sara@test.local' });
  });

  it('lets the user go back and try another email', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/forgot-password', () => HttpResponse.json({ success: true })),
    );
    renderForm();

    await user.type(screen.getByLabelText('Work email'), 'sara@test.local');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    await user.click(await screen.findByRole('button', { name: 'Use a different email' }));

    expect(screen.getByRole('heading', { name: 'Forgot your password?' })).toBeInTheDocument();
  });

  it('shows the server message when too many requests were made', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/forgot-password', () =>
        HttpResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 },
        ),
      ),
    );
    renderForm();

    await user.type(screen.getByLabelText('Work email'), 'sara@test.local');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(
      await screen.findByText('Too many requests. Please try again later.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Check your email' })).not.toBeInTheDocument();
  });
});