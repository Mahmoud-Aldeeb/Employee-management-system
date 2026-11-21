import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LeaveBalanceCard from '@/components/leave/LeaveBalanceCard';
import type { LeaveBalance } from '@/types';

const balance: LeaveBalance = {
  year: 2026,
  tier: 'standard',
  entitlement: 21,
  taken: 3,
  pending: 1,
  remaining: 17,
  casual: { limit: 7, taken: 1, pending: 0, remaining: 6 },
  sickTaken: 2,
  annualAvailableFrom: '2023-08-01T00:00:00.000Z',
  annualAvailable: true,
};

describe('LeaveBalanceCard', () => {
  it('shows the remaining days, the usage and the breakdown', () => {
    render(<LeaveBalanceCard balance={balance} />);

    const card = screen.getByRole('region', { name: 'Leave balance' });

    expect(within(card).getByText('2026 · Standard')).toBeInTheDocument();
    expect(within(card).getByText('17')).toBeInTheDocument();
    expect(within(card).getByText('of 21 days left')).toBeInTheDocument();
    expect(within(card).getByRole('progressbar', { name: 'Annual leave used' })).toHaveAttribute(
      'aria-valuenow',
      '4',
    );
    expect(within(card).getByText('3 days')).toBeInTheDocument();
    expect(within(card).getByText('1 day')).toBeInTheDocument();
    expect(within(card).getByText('6 of 7')).toBeInTheDocument();
    expect(within(card).getByText('2 days')).toBeInTheDocument();
  });

  it('does not show a negative balance', () => {
    render(<LeaveBalanceCard balance={{ ...balance, taken: 24, remaining: -3 }} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('explains when annual leave is not available yet', () => {
    render(
      <LeaveBalanceCard
        balance={{
          ...balance,
          tier: 'first-year',
          annualAvailable: false,
          annualAvailableFrom: '2999-01-15T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('2026 · First year')).toBeInTheDocument();
    expect(screen.getByText(/becomes available from Jan 15, 2999/)).toBeInTheDocument();
  });

  it('hides the availability notice once annual leave is available', () => {
    render(<LeaveBalanceCard balance={balance} />);

    expect(screen.queryByText(/becomes available from/)).not.toBeInTheDocument();
  });

  it('shows the next approved leave only when asked to', () => {
    const { rerender } = render(<LeaveBalanceCard balance={balance} />);
    expect(screen.queryByText('Next approved leave')).not.toBeInTheDocument();

    rerender(
      <LeaveBalanceCard
        balance={balance}
        upcoming={{
          type: 'CASUAL',
          startDate: '2026-12-06T00:00:00.000Z',
          endDate: '2026-12-07T00:00:00.000Z',
        }}
      />,
    );
    expect(screen.getByText('Next approved leave')).toBeInTheDocument();
    expect(screen.getByText('Casual leave · Dec 06 - Dec 07, 2026')).toBeInTheDocument();

    rerender(<LeaveBalanceCard balance={balance} upcoming={null} />);
    expect(screen.getByText('No upcoming approved leave')).toBeInTheDocument();
  });
});