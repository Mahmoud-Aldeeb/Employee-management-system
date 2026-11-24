import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import AuditLogView from '@/components/audit-log/AuditLogView';
import type { AuditLogEntry, AuditLogPage } from '@/types';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const entry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
  id: 'a1',
  action: 'SALARY_UPDATED',
  actorId: 'u1',
  actorEmail: 'admin@test.local',
  targetId: 'e1',
  targetLabel: 'Salma Farouk',
  changes: [{ field: 'basicSalary', from: 6000, to: 6500 }],
  createdAt: '2026-01-15T22:30:00.000Z',
  ...overrides,
});

const pageOf = (
  data: AuditLogEntry[],
  overrides: Partial<AuditLogPage> = {},
): AuditLogPage => ({
  data,
  page: 1,
  limit: 20,
  total: data.length,
  totalPages: 1,
  ...overrides,
});

function serveAudit(
  respond: (params: URLSearchParams) => AuditLogPage,
  seen: URLSearchParams[] = [],
) {
  return http.get('/api/audit-logs', ({ request }) => {
    const params = new URL(request.url).searchParams;
    seen.push(params);
    return HttpResponse.json(respond(params));
  });
}

describe('AuditLogView', () => {
  it('shows who did what, to whom, with the values before and after', async () => {
    server.use(serveAudit(() => pageOf([entry()])));
    renderWithClient(<AuditLogView />);

    const entries = await screen.findByRole('region', { name: 'Audit entries' });

    expect(within(entries).getByText('Salary updated')).toBeInTheDocument();
    expect(within(entries).getByText('Salma Farouk')).toBeInTheDocument();
    expect(within(entries).getByText('Basic salary: 6000 → 6500')).toBeInTheDocument();
    expect(within(entries).getByText('admin@test.local')).toBeInTheDocument();
    expect(within(entries).getByText('16 Jan 2026 · 00:30')).toBeInTheDocument();
  });

  it('sends the type, search and date filters to the API', async () => {
    const user = userEvent.setup();
    const seen: URLSearchParams[] = [];
    server.use(serveAudit(() => pageOf([entry()]), seen));
    renderWithClient(<AuditLogView />);
    await screen.findByRole('region', { name: 'Audit entries' });

    await user.selectOptions(screen.getByLabelText('Event type'), 'LEAVE_APPROVED');
    await user.type(screen.getByLabelText('Search'), 'Salma');
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-01-31' } });

    await waitFor(() => {
      const last = seen.at(-1);
      expect(last?.get('action')).toBe('LEAVE_APPROVED');
      expect(last?.get('search')).toBe('Salma');
      expect(last?.get('from')).toBe('2026-01-01');
      expect(last?.get('to')).toBe('2026-01-31');
      expect(last?.get('page')).toBe('1');
      expect(last?.get('limit')).toBe('20');
    });
  });

  it('moves between pages', async () => {
    const user = userEvent.setup();
    server.use(
      serveAudit((params) =>
        params.get('page') === '2'
          ? pageOf([entry({ id: 'a2', targetLabel: 'Tamer Wahba' })], {
            page: 2,
            total: 21,
            totalPages: 2,
          })
          : pageOf([entry()], { total: 21, totalPages: 2 }),
      ),
    );
    renderWithClient(<AuditLogView />);

    expect(await screen.findByText('Salma Farouk')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('21 events')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Tamer Wahba')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('goes back to the first page when a filter changes', async () => {
    const user = userEvent.setup();
    const seen: URLSearchParams[] = [];
    server.use(
      serveAudit(
        (params) =>
          params.get('page') === '2'
            ? pageOf([entry({ id: 'a2', targetLabel: 'Tamer Wahba' })], {
              page: 2,
              total: 21,
              totalPages: 2,
            })
            : pageOf([entry()], { total: 21, totalPages: 2 }),
        seen,
      ),
    );
    renderWithClient(<AuditLogView />);

    await screen.findByText('Salma Farouk');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Tamer Wahba');

    await user.selectOptions(screen.getByLabelText('Event type'), 'LEAVE_REJECTED');

    await waitFor(() => {
      expect(seen.at(-1)?.get('action')).toBe('LEAVE_REJECTED');
      expect(seen.at(-1)?.get('page')).toBe('1');
    });
  });

  it('clears every filter at once', async () => {
    const user = userEvent.setup();
    const seen: URLSearchParams[] = [];
    server.use(serveAudit(() => pageOf([entry()]), seen));
    renderWithClient(<AuditLogView />);
    await screen.findByRole('region', { name: 'Audit entries' });

    await user.selectOptions(screen.getByLabelText('Event type'), 'LEAVE_REJECTED');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByLabelText('Event type')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    await waitFor(() => expect(seen.at(-1)?.has('action')).toBe(false));
  });

  it('says so when there is no activity', async () => {
    server.use(serveAudit(() => pageOf([])));
    renderWithClient(<AuditLogView />);

    expect(await screen.findByText('No activity found')).toBeInTheDocument();
  });

  it('shows a fallback message when the request fails', async () => {
    server.use(
      http.get('/api/audit-logs', () =>
        HttpResponse.json({ error: 'Failed' }, { status: 500 }),
      ),
    );
    renderWithClient(<AuditLogView />);

    expect(await screen.findByText('Failed to load the audit log')).toBeInTheDocument();
  });
});