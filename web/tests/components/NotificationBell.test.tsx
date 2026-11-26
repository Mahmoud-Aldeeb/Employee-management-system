import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import NotificationBell from '@/components/notifications/NotificationBell';
import type { NotificationEntry, NotificationPage } from '@/types';
import { router } from '../mocks/navigation';
import { unreadCount } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const entry = (overrides: Partial<NotificationEntry> = {}): NotificationEntry => ({
  id: 'n1',
  type: 'LEAVE_DECIDED',
  title: 'Leave approved',
  message: 'Your annual leave (01 Dec 2026 - 02 Dec 2026) was approved.',
  link: '/leave',
  readAt: null,
  createdAt: '2026-01-15T22:30:00.000Z',
  ...overrides,
});

const pageOf = (data: NotificationEntry[]): NotificationPage => ({
  data,
  page: 1,
  limit: 10,
  total: data.length,
  totalPages: 1,
  unreadCount: data.filter((item) => item.readAt === null).length,
});

function serveList(data: NotificationEntry[], seen: URLSearchParams[] = []) {
  return http.get('/api/notifications', ({ request }) => {
    seen.push(new URL(request.url).searchParams);
    return HttpResponse.json(pageOf(data));
  });
}

async function openPanel() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: /^Notifications/ }));
  return { user, panel: await screen.findByRole('dialog', { name: 'Notifications panel' }) };
}

describe('NotificationBell', () => {
  it('shows no badge when everything is read', async () => {
    let asked = false;
    server.use(
      http.get('/api/notifications/unread-count', () => {
        asked = true;
        return HttpResponse.json({ count: 0 });
      }),
    );
    renderWithClient(<NotificationBell placement="header" />);

    await waitFor(() => expect(asked).toBe(true));
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows the unread count on the bell', async () => {
    server.use(unreadCount(3));
    renderWithClient(<NotificationBell placement="header" />);

    expect(await screen.findByRole('button', { name: 'Notifications, 3 unread' })).toHaveTextContent('3');
  });

  it('caps the badge at 99+', async () => {
    server.use(unreadCount(150));
    renderWithClient(<NotificationBell placement="header" />);

    expect(await screen.findByRole('button', { name: 'Notifications, 150 unread' })).toHaveTextContent('99+');
  });

  it('loads the list only when the panel is opened', async () => {
    const seen: URLSearchParams[] = [];
    server.use(
      unreadCount(1),
      serveList(
        [
          entry(),
          entry({
            id: 'n2',
            type: 'PAYSLIP_ISSUED',
            title: 'New payslip',
            message: 'Your payslip for 10/2026 is ready.',
            link: '/payslips',
            readAt: '2026-01-16T08:00:00.000Z',
            createdAt: '2026-01-16T10:00:00.000Z',
          }),
        ],
        seen,
      ),
    );
    renderWithClient(<NotificationBell placement="header" />);
    await screen.findByRole('button', { name: 'Notifications, 1 unread' });
    expect(seen).toHaveLength(0);

    const { panel } = await openPanel();

    expect(await within(panel).findByText('Leave approved')).toBeInTheDocument();
    expect(within(panel).getByText('New payslip')).toBeInTheDocument();
    expect(within(panel).getByText('16 Jan 2026 · 00:30')).toBeInTheDocument();
    expect(within(panel).getByText('16 Jan 2026 · 12:00')).toBeInTheDocument();
    expect(seen[0].get('page')).toBe('1');
    expect(seen[0].get('limit')).toBe('10');
    expect(seen[0].has('unread')).toBe(false);
  });

  it('marks an unread notification as read, opens its page and closes the panel', async () => {
    const read: string[] = [];
    server.use(
      unreadCount(1),
      serveList([entry()]),
      http.patch('/api/notifications/:id/read', ({ params }) => {
        read.push(String(params.id));
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithClient(<NotificationBell placement="header" />);
    const { user, panel } = await openPanel();

    await user.click(await within(panel).findByRole('button', { name: /Leave approved/ }));

    await waitFor(() => expect(read).toEqual(['n1']));
    expect(router.push).toHaveBeenCalledWith('/leave');
    expect(screen.queryByRole('dialog', { name: 'Notifications panel' })).not.toBeInTheDocument();
  });

  it('does not mark a notification that is already read', async () => {
    const read: string[] = [];
    server.use(
      unreadCount(0),
      serveList([entry({ readAt: '2026-01-16T08:00:00.000Z' })]),
      http.patch('/api/notifications/:id/read', ({ params }) => {
        read.push(String(params.id));
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithClient(<NotificationBell placement="header" />);
    const { user, panel } = await openPanel();

    await user.click(await within(panel).findByRole('button', { name: /Leave approved/ }));

    expect(router.push).toHaveBeenCalledWith('/leave');
    expect(read).toEqual([]);
  });

  it('never navigates to a link outside the app', async () => {
    server.use(
      unreadCount(0),
      serveList([entry({ link: 'https://evil.example', readAt: '2026-01-16T08:00:00.000Z' })]),
    );
    renderWithClient(<NotificationBell placement="header" />);
    const { user, panel } = await openPanel();

    await user.click(await within(panel).findByRole('button', { name: /Leave approved/ }));

    expect(router.push).not.toHaveBeenCalled();
  });

  it('marks everything as read', async () => {
    let markedAll = false;
    server.use(
      unreadCount(2),
      serveList([entry(), entry({ id: 'n2', title: 'New payslip' })]),
      http.post('/api/notifications/read-all', () => {
        markedAll = true;
        return HttpResponse.json({ success: true, updated: 2 });
      }),
    );
    renderWithClient(<NotificationBell placement="header" />);
    const { user, panel } = await openPanel();
    await within(panel).findByText('Leave approved');

    await user.click(within(panel).getByRole('button', { name: 'Mark all as read' }));

    await waitFor(() => expect(markedAll).toBe(true));
  });

  it('shows an empty state', async () => {
    server.use(serveList([]));
    renderWithClient(<NotificationBell placement="header" />);
    const { panel } = await openPanel();

    expect(await within(panel).findByText('No notifications yet')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
  });

  it('shows a message when the list cannot be loaded', async () => {
    server.use(
      http.get('/api/notifications', () => HttpResponse.json({ error: 'Failed' }, { status: 500 })),
    );
    renderWithClient(<NotificationBell placement="header" />);
    const { panel } = await openPanel();

    expect(await within(panel).findByText('Could not load notifications')).toBeInTheDocument();
  });

  it('closes with Escape and with a click outside', async () => {
    server.use(serveList([entry()]));
    renderWithClient(<NotificationBell placement="header" />);
    const { user } = await openPanel();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Notifications panel' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Notifications/ }));
    expect(await screen.findByRole('dialog', { name: 'Notifications panel' })).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole('dialog', { name: 'Notifications panel' })).not.toBeInTheDocument();
  });
});