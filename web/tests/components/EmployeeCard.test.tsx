import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmployeeCard from '@/components/employees/EmployeeCard';
import type { Employee } from '@/types';

const base: Employee = {
  _id: 'e1',
  id: 'e1',
  firstName: 'Mona',
  lastName: 'Hassan',
  email: 'mona@test.local',
  phone: '0100',
  position: 'Developer',
  department: 'Engineering',
  basicSalary: 5000,
  allowances: 0,
  deductions: 0,
  employmentStatus: 'ACTIVE',
  joinDate: '2026-01-15T00:00:00.000Z',
  isDeleted: false,
  bio: '',
  user: { email: 'mona@test.local', role: 'EMPLOYEE', invitedAt: null },
};

const invited: Employee = {
  ...base,
  user: { email: 'mona@test.local', role: 'EMPLOYEE', invitedAt: '2026-11-26T10:00:00.000Z' },
};

function renderCard(employee: Employee) {
  const onResendInvite = vi.fn();
  render(
    <EmployeeCard
      employee={employee}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onResendInvite={onResendInvite}
    />,
  );
  return onResendInvite;
}

describe('EmployeeCard', () => {
  it('marks a pending invitation and lets the admin resend it', async () => {
    const user = userEvent.setup();
    const onResendInvite = renderCard(invited);

    expect(screen.getByText('INVITED')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Resend invite to Mona Hassan' }));

    expect(onResendInvite).toHaveBeenCalledWith(invited);
  });

  it('does not offer to resend once the employee has a password', () => {
    renderCard(base);

    expect(screen.queryByText('INVITED')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Resend invite/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Mona Hassan' })).toBeInTheDocument();
  });

  it('hides every action for a deactivated employee', () => {
    renderCard({ ...invited, isDeleted: true });

    expect(screen.getByText('DELETED')).toBeInTheDocument();
    expect(screen.queryByText('INVITED')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});