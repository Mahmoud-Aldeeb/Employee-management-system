import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'react-hot-toast';
import { describe, expect, it, vi } from 'vitest';
import EmployeeForm from '@/components/employees/EmployeeForm';
import type { Employee } from '@/types';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

const INVITE_LABEL = 'Send an invitation email instead of setting a password';

const existing: Employee = {
  _id: 'e1',
  id: 'e1',
  firstName: 'Sara',
  lastName: 'Ali',
  email: 'sara@test.local',
  phone: '0100',
  position: 'Designer',
  department: 'Design',
  basicSalary: 4000,
  allowances: 100,
  deductions: 50,
  employmentStatus: 'ACTIVE',
  joinDate: '2025-03-01T00:00:00.000Z',
  isDeleted: false,
  bio: 'Hi',
  user: { email: 'sara@test.local', role: 'EMPLOYEE' },
};

const newEmployeeBody = {
  firstName: 'Mona',
  lastName: 'Hassan',
  phone: '01000000000',
  joinDate: '2026-01-15',
  bio: '',
  position: 'Developer',
  basicSalary: 0,
  allowances: 0,
  deductions: 0,
  email: 'mona@test.local',
  role: 'EMPLOYEE',
  canCheckInAnywhere: false,
};

function renderForm(initialData?: Employee) {
  const onSuccess = vi.fn();
  renderWithClient(
    <>
      <EmployeeForm initialData={initialData} onSuccess={onSuccess} onCancel={vi.fn()} />
      <Toaster />
    </>,
  );
  return onSuccess;
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('First Name'), 'Mona');
  await user.type(screen.getByLabelText('Last Name'), 'Hassan');
  await user.type(screen.getByLabelText('Phone Number'), '01000000000');
  fireEvent.change(screen.getByLabelText('Join Date'), { target: { value: '2026-01-15' } });
  await user.type(screen.getByLabelText('Position'), 'Developer');
  await user.type(screen.getByLabelText('Work Email'), 'mona@test.local');
}

function serveCreate(
  invite: string,
  capture: { body?: unknown } = {},
) {
  return http.post('/api/employees', async ({ request }) => {
    capture.body = await request.json();
    return HttpResponse.json({ success: true, invite }, { status: 201 });
  });
}

describe('EmployeeForm', () => {
  it('shows every required-field message on an empty submit', async () => {
    const user = userEvent.setup();
    renderForm();
    await screen.findByLabelText(INVITE_LABEL);

    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    for (const message of [
      'First name is required',
      'Last name is required',
      'Phone number is required',
      'Join date is required',
      'Position is required',
      'Enter a valid email address',
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(screen.queryByText('Use at least 8 characters')).not.toBeInTheDocument();
  });

  it('invites the employee by default and sends no password', async () => {
    const user = userEvent.setup();
    const capture: { body?: unknown } = {};
    server.use(serveCreate('QUEUED', capture));
    const onSuccess = renderForm();
    await screen.findByLabelText(INVITE_LABEL);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capture.body).toEqual(newEmployeeBody);
    expect(
      await screen.findByText('Employee created. An invitation email is on its way.'),
    ).toBeInTheDocument();
  });

  it('creates an employee with a password when the invitation is switched off', async () => {
    const user = userEvent.setup();
    const capture: { body?: unknown } = {};
    server.use(serveCreate('NOT_REQUIRED', capture));
    const onSuccess = renderForm();

    await user.click(await screen.findByLabelText(INVITE_LABEL));
    await fillRequiredFields(user);
    await user.type(screen.getByLabelText('Password'), 'Temp#12345');
    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capture.body).toEqual({ ...newEmployeeBody, password: 'Temp#12345' });
    expect(await screen.findByText('Employee created')).toBeInTheDocument();
  });

  it('requires a password once the invitation is switched off', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(await screen.findByLabelText(INVITE_LABEL));
    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument();
  });

  it('warns when the invitation could not be sent', async () => {
    const user = userEvent.setup();
    server.use(serveCreate('FAILED'));
    const onSuccess = renderForm();
    await screen.findByLabelText(INVITE_LABEL);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(await screen.findByText(/invitation could not be sent/)).toBeInTheDocument();
  });

  it('asks for a password and hides the invitation option in demo mode', async () => {
    const user = userEvent.setup();
    let asked = false;
    server.use(
      http.get('/api/demo/status', () => {
        asked = true;
        return HttpResponse.json({ enabled: true });
      }),
    );
    renderForm();
    await waitFor(() => expect(asked).toBe(true));

    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument();
    expect(screen.queryByLabelText(INVITE_LABEL)).not.toBeInTheDocument();
  });

  it('updates an employee without sending an empty password', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.put('/api/employees/e1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    const onSuccess = renderForm(existing);

    const position = screen.getByLabelText('Position');
    await user.clear(position);
    await user.type(position, 'Lead Designer');
    await user.click(screen.getByRole('button', { name: 'Update Employee' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(screen.queryByLabelText(INVITE_LABEL)).not.toBeInTheDocument();
    expect(body).toEqual({
      firstName: 'Sara',
      lastName: 'Ali',
      phone: '0100',
      joinDate: '2025-03-01',
      bio: 'Hi',
      position: 'Lead Designer',
      basicSalary: 4000,
      allowances: 100,
      deductions: 50,
      email: 'sara@test.local',
      role: 'EMPLOYEE',
      department: 'Design',
      employmentStatus: 'ACTIVE',
      canCheckInAnywhere: false,
    });
  });

  it('rejects a new password that is too short when editing', async () => {
    const user = userEvent.setup();
    renderForm(existing);

    await user.type(screen.getByLabelText('Change Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Update Employee' }));

    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument();
  });

  it('sends the exemption when the employee may check in from anywhere', async () => {
    const user = userEvent.setup();
    const capture: { body?: unknown } = {};
    server.use(serveCreate('QUEUED', capture));
    const onSuccess = renderForm();
    await screen.findByLabelText(INVITE_LABEL);

    await fillRequiredFields(user);
    await user.click(screen.getByLabelText('Can check in from anywhere'));
    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(capture.body).toEqual({ ...newEmployeeBody, canCheckInAnywhere: true });
  });

  it('shows the current exemption when editing', () => {
    renderForm({ ...existing, canCheckInAnywhere: true });

    expect(screen.getByLabelText('Can check in from anywhere')).toBeChecked();
  });


});