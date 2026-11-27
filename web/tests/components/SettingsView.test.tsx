import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import SettingsView from '@/components/settings/SettingsView';
import { SESSION_KEY } from '@/hooks/use-auth';
import { admin, employee, profile, signedIn } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const person = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@test.local' };

describe('SettingsView', () => {
  it('lets admins manage the work locations', async () => {
    server.use(signedIn(admin), profile(person), http.get('/api/workplaces', () => HttpResponse.json([])));
    renderWithClient(<SettingsView />);

    expect(await screen.findByRole('heading', { name: 'Work locations' })).toBeInTheDocument();
  });

  it('keeps the work locations away from employees', async () => {
    server.use(signedIn(employee), profile(person));
    const { client } = renderWithClient(<SettingsView />);

    await screen.findByRole('heading', { name: 'Settings' });
    await waitFor(() => expect(client.getQueryState(SESSION_KEY)?.status).toBe('success'));

    expect(screen.queryByRole('heading', { name: 'Work locations' })).not.toBeInTheDocument();
  });
});