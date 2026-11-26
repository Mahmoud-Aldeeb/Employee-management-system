import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import NotificationsView from '@/components/notifications/NotificationsView';
import type { NotificationEntry, NotificationPage } from '@/types';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const entry = (overrides: Partial<NotificationEntry> = {}): NotificationEntry => ({
  id: 'n1',
  type: 'LEAVE_REQUESTED',
  title: 'New leave request',
  message: 'Sara Ali requested annual leave (01 Dec 2026 - 02 Dec 2026).',
  link: '/leave',
  readAt: null,
  createdAt: '2026-01-15T22:30:00.000Z',
  ...overrides,
});

const pageOf = (
  data: NotificationEntry[],
  overrides: Partial<NotificationPage> = {},
): NotificationPage => ({
  data,
  page: 1,
  limit: 20,
  total: data.length,
  totalPages: 1,
  unreadCount: data.filter((item) => item.readAt === null).length,
  ...overrides,
});

function serveList(
  respond: (params: URLSearchParams) => NotificationPage,
  seen: URLSearchParams[] = [],
) {
  return http.get('/api/notifications', ({ request }) => {
    const params = new URL(request.url).searchParams;
    seen.push(params);
    return HttpResponse.json(respond(params));
  });
}

describe('NotificationsView', () => {
  it('lists the notifications with their time and unread state', async () => {
    server.use(serveList(() => pageOf([entry()])));
    renderWithClient(<NotificationsView />);

    const list = await screen.findByRole('region', { name: 'Notification list' });

    expect(within(list).getByText('New leave request')).toBeInTheDocument();
    expect(within(list).getByText(/Sara Ali requested annual leave/)).toBeInTheDocument();
    expect(within(list).getByText('16 Jan 2026 · 00:30')).toBeInTheDocument();
    expect(within(list).getByText('Unread')).toBeInTheDocument();
  });

  it('switches to the unread notifications and back to the first page', async () => {
    const user = userEvent.setup();
    const seen: URLSearchParams[] = [];
    server.use(
      serveList(
        (params) =>
          params.get('page') === '2'
            ? pageOf([entry({ id: 'n2', title: 'Second page' })], { page: 2, total: 21, totalPages: 2 })
            : pageOf([entry()], { total: 21, totalPages: 2 }),
        seen,
      ),
    );
    renderWithClient(<NotificationsView />);

    await screen.findByText('New leave request');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Second page');

    await user.click(screen.getByRole('button', { name: 'Unread' }));

    await waitFor(() => {
      expect(seen.at(-1)?.get('unread')).toBe('true');
      expect(seen.at(-1)?.get('page')).toBe('1');
    });
  });

  it('moves between pages', async () => {
    const user = userEvent.setup();
    server.use(
      serveList((params) =>
        params.get('page') === '2'
          ? pageOf([entry({ id: 'n2', title: 'Second page' })], { page: 2, total: 21, totalPages: 2 })
          : pageOf([entry()], { total: 21, totalPages: 2 }),
      ),
    );
    renderWithClient(<NotificationsView />);

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('21 notifications')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Second page')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('marks everything as read', async () => {
    const user = userEvent.setup();
    let markedAll = false;
    server.use(
      serveList(() => pageOf([entry()])),
      http.post('/api/notifications/read-all', () => {
        markedAll = true;
        return HttpResponse.json({ success: true, updated: 1 });
      }),
    );
    renderWithClient(<NotificationsView />);
    await screen.findByText('New leave request');

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));

    await waitFor(() => expect(markedAll).toBe(true));
  });

  it('has a different empty message for each tab', async () => {
    const user = userEvent.setup();
    server.use(serveList(() => pageOf([])));
    renderWithClient(<NotificationsView />);

    expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Unread' }));

    expect(await screen.findByText('You are all caught up')).toBeInTheDocument();
  });

  it('shows a fallback message when the request fails', async () => {
    server.use(
      http.get('/api/notifications', () => HttpResponse.json({ error: 'Failed' }, { status: 500 })),
    );
    renderWithClient(<NotificationsView />);

    expect(await screen.findByText('Failed to load notifications')).toBeInTheDocument();
  });
});