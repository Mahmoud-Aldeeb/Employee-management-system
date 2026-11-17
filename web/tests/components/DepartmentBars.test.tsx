import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DepartmentBars from '@/components/analytics/DepartmentBars';

describe('DepartmentBars', () => {
  it('sizes every bar relative to the busiest department', () => {
    render(
      <DepartmentBars
        items={[
          { department: 'Engineering', count: 10 },
          { department: 'Design', count: 5 },
        ]}
      />,
    );

    const engineering = screen.getByRole('progressbar', { name: 'Engineering' });
    const design = screen.getByRole('progressbar', { name: 'Design' });

    expect(engineering).toHaveAttribute('aria-valuenow', '10');
    expect(engineering).toHaveStyle({ width: '100%' });
    expect(design).toHaveStyle({ width: '50%' });
  });

  it('does not break when every count is zero', () => {
    render(<DepartmentBars items={[{ department: 'Sales', count: 0 }]} />);

    expect(screen.getByRole('progressbar', { name: 'Sales' })).toHaveStyle({ width: '0%' });
  });
});