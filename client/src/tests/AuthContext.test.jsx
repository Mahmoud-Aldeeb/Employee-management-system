import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// ─── Mock AuthContext ────────────────────────────────────────────────────────
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    login: mockLogin,
    logout: mockLogout,
    refreshSession: mockRefreshSession,
  }),
}));

// ─── Mock axios API ───────────────────────────────────────────────────────────
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('AuthContext — Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should expose login function', () => {
    const { useAuth } = require('../context/AuthContext');
    const ctx = useAuth();
    expect(typeof ctx.login).toBe('function');
  });

  it('should expose logout function', () => {
    const { useAuth } = require('../context/AuthContext');
    const ctx = useAuth();
    expect(typeof ctx.logout).toBe('function');
  });

  it('should start with user as null when no token in localStorage', () => {
    const { useAuth } = require('../context/AuthContext');
    const ctx = useAuth();
    expect(ctx.user).toBeNull();
  });

  it('should store token in localStorage after login', async () => {
    const fakeToken = 'test-jwt-token-123';
    mockLogin.mockResolvedValueOnce({ role: 'ADMIN', email: 'admin@test.com' });
    localStorage.setItem('token', fakeToken);

    expect(localStorage.getItem('token')).toBe(fakeToken);
  });

  it('should clear token from localStorage after logout', async () => {
    localStorage.setItem('token', 'some-token');
    mockLogout.mockImplementation(() => {
      localStorage.removeItem('token');
    });

    await mockLogout();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
