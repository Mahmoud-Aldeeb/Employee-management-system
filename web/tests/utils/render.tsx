import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function renderWithClient(ui: ReactElement) {
  const client = createTestQueryClient();
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) };
}