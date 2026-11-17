import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AdminOnly from '@/components/AdminOnly';
import AppShell from '@/components/AppShell';
import { router } from '../mocks/navigation';
import { admin, employee, profile, signedIn, signedOut } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

describe('AppShell', () => {
  it('sends anonymous visitors to the login page and hides the content', async () => {
    server.use(...signedOut);
    renderWithClient(
      <AppShell>
        <p>Secret page</p>
      </AppShell>,
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  it('renders the page with the sidebar for a signed-in user', async () => {
    server.use(
      signedIn(employee),
      profile({ firstName: 'Sara', lastName: 'Ali', email: employee.email }),
    );
    renderWithClient(
      <AppShell>
        <p>Secret page</p>
      </AppShell>,
    );

    expect(await screen.findByText('Secret page')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Attendance' }).length).toBeGreaterThan(0);
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('AdminOnly', () => {
  it('redirects employees to the dashboard', async () => {
    server.use(signedIn(employee));
    renderWithClient(
      <AdminOnly>
        <p>Admins only</p>
      </AdminOnly>,
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
    expect(screen.queryByText('Admins only')).not.toBeInTheDocument();
  });

  it('shows the content to admins', async () => {
    server.use(signedIn(admin));
    renderWithClient(
      <AdminOnly>
        <p>Admins only</p>
      </AdminOnly>,
    );

    expect(await screen.findByText('Admins only')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });
});