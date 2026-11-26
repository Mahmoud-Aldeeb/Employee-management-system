import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'react-hot-toast';
import { describe, expect, it } from 'vitest';
import LoginForm from '@/components/LoginForm';
import { router } from '../mocks/navigation';
import { admin, signedOut } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

function renderForm() {
  server.use(...signedOut);

  return renderWithClient(
    <>
      <LoginForm
        portal="admin"
        title="Admin Portal"
        subtitle="Sign in to manage the organization"
      />
      <Toaster />
    </>,
  );
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email address'), 'admin@test.local');
  await user.type(screen.getByLabelText('Password'), 'Secret#123');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginForm', () => {
  it('renders the portal text and both fields', () => {
    renderForm();

    expect(screen.getByRole('heading', { name: 'Admin Portal' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to manage the organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows validation messages without calling the API', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderForm();
    const password = screen.getByLabelText('Password');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('sends the portal role and redirects to the dashboard on success', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ user: admin });
      }),
    );
    renderForm();

    await fillAndSubmit(user);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
    expect(body).toEqual({
      email: 'admin@test.local',
      password: 'Secret#123',
      role_type: 'admin',
    });
  });

  it('shows the server error and stays on the page when login fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 }),
      ),
    );
    renderForm();

    await fillAndSubmit(user);

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('links to the password reset page', () => {
    renderForm();

    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

});