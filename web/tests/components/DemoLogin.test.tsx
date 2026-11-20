import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'react-hot-toast';
import { describe, expect, it } from 'vitest';
import DemoLogin from '@/components/DemoLogin';
import { router } from '../mocks/navigation';
import { admin, employee } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const demoStatus = (enabled: boolean) =>
  http.get('/api/demo/status', () => HttpResponse.json({ enabled }));

function renderDemoLogin() {
  return renderWithClient(
    <>
      <DemoLogin />
      <Toaster />
    </>,
  );
}

describe('DemoLogin', () => {
  it('signs in as the admin and opens the dashboard', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      demoStatus(true),
      http.post('/api/demo/login', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ user: admin });
      }),
    );
    renderDemoLogin();

    await user.click(await screen.findByRole('button', { name: 'Explore as Admin' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
    expect(body).toEqual({ role: 'admin' });
  });

  it('signs in as the employee', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      demoStatus(true),
      http.post('/api/demo/login', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ user: employee });
      }),
    );
    renderDemoLogin();

    await user.click(await screen.findByRole('button', { name: 'Explore as Employee' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
    expect(body).toEqual({ role: 'employee' });
  });

  it('renders nothing when demo mode is off', async () => {
    let asked = false;
    server.use(
      http.get('/api/demo/status', () => {
        asked = true;
        return HttpResponse.json({ enabled: false });
      }),
    );
    renderDemoLogin();

    await waitFor(() => expect(asked).toBe(true));

    expect(screen.queryByRole('button', { name: /Explore as/ })).not.toBeInTheDocument();
  });

  it('shows the server message when the demo is unavailable', async () => {
    const user = userEvent.setup();
    server.use(
      demoStatus(true),
      http.post('/api/demo/login', () =>
        HttpResponse.json({ error: 'Demo data is not available' }, { status: 503 }),
      ),
    );
    renderDemoLogin();

    await user.click(await screen.findByRole('button', { name: 'Explore as Admin' }));

    expect(await screen.findByText('Demo data is not available')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });
});