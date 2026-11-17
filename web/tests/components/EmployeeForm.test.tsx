import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import EmployeeForm from '@/components/employees/EmployeeForm';
import type { Employee } from '@/types';
import { server } from '../msw/server';
import { renderWithClient } from '../utils/render';

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

function renderForm(initialData?: Employee) {
  const onSuccess = vi.fn();
  renderWithClient(
    <EmployeeForm initialData={initialData} onSuccess={onSuccess} onCancel={vi.fn()} />,
  );
  return onSuccess;
}

describe('EmployeeForm', () => {
  it('shows every required-field message on an empty submit', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    for (const message of [
      'First name is required',
      'Last name is required',
      'Phone number is required',
      'Join date is required',
      'Position is required',
      'Enter a valid email address',
      'Use at least 8 characters',
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
  });

  it('creates an employee with the expected payload', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post('/api/employees', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true }, { status: 201 });
      }),
    );
    const onSuccess = renderForm();

    await user.type(screen.getByLabelText('First Name'), 'Mona');
    await user.type(screen.getByLabelText('Last Name'), 'Hassan');
    await user.type(screen.getByLabelText('Phone Number'), '01000000000');
    fireEvent.change(screen.getByLabelText('Join Date'), { target: { value: '2026-01-15' } });
    await user.type(screen.getByLabelText('Position'), 'Developer');
    await user.type(screen.getByLabelText('Work Email'), 'mona@test.local');
    await user.type(screen.getByLabelText('Temporary Password'), 'Temp#12345');
    await user.click(screen.getByRole('button', { name: 'Create Employee' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(body).toEqual({
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
      password: 'Temp#12345',
    });
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
    });
  });

  it('rejects a new password that is too short when editing', async () => {
    const user = userEvent.setup();
    renderForm(existing);

    await user.type(screen.getByLabelText('Change Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Update Employee' }));

    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument();
  });
});