import { formatCairoDate } from '../common/utils/cairo-time.js';

export function formatLeavePeriod(startDate: Date, endDate: Date) {
  return `${formatCairoDate(startDate)} - ${formatCairoDate(endDate)}`;
}
