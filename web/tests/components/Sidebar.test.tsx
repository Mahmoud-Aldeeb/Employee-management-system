import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from '@/components/Sidebar';
import type { SessionUser } from '@/types';
import { router } from '../mocks/navigation';
import { admin, employee, profile } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

function renderSidebar(user: SessionUser, onClose = vi.fn()) {
  server.use(profile({ firstName: 'Ada', lastName: 'Lovelace', email: user.email }));
  renderWithClient(<Sidebar user={user} mobileOpen={false} onClose={onClose} />);
  return onClose;
}

describe('Sidebar', () => {
  it('shows the admin navigation and the profile name', async () => {
    renderSidebar(admin);

    expect((await screen.findAllByText('Ada Lovelace')).length).toBeGreaterThan(0);
    for (const name of ['Dashboard', 'Employees', 'Analytics', 'Leave', 'Team Calendar', 'Payslips', 'Settings']) {
      expect(screen.getAllByRole('link', { name })).toHaveLength(2);
    }
    expect(screen.queryAllByRole('link', { name: 'Attendance' })).toHaveLength(0);
    expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0);
  });

  it('shows the employee navigation without admin pages', async () => {
    renderSidebar(employee);

    await screen.findAllByText('Ada Lovelace');
    expect(screen.getAllByRole('link', { name: 'Attendance' })).toHaveLength(2);
    expect(screen.queryAllByRole('link', { name: 'Employees' })).toHaveLength(0);
    expect(screen.queryAllByRole('link', { name: 'Analytics' })).toHaveLength(0);
    expect(screen.getAllByRole('link', { name: 'Team Calendar' })).toHaveLength(2);
  });

  it('logs out and returns to the login page', async () => {
    const user = userEvent.setup();
    let loggedOut = false;
    server.use(
      http.post('/api/auth/logout', () => {
        loggedOut = true;
        return HttpResponse.json({ success: true });
      }),
    );
    renderSidebar(admin);

    await user.click(screen.getAllByRole('button', { name: /log out/i })[0]);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    expect(loggedOut).toBe(true);
  });

  it('asks the parent to close the mobile menu', async () => {
    const user = userEvent.setup();
    const onClose = renderSidebar(admin);

    await user.click(screen.getAllByRole('button', { name: 'Close menu' })[0]);

    expect(onClose).toHaveBeenCalled();
  });
});