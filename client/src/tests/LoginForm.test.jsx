import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// ─── Mock useAuth and api ─────────────────────────────────────────────────────
const mockLogin = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// ─── Mock react-hot-toast ────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Mock react-router-dom navigate ──────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import LoginForm from '../components/LoginForm';

const renderLoginForm = (role = 'admin') => {
  return render(
    <BrowserRouter>
      <LoginForm
        role={role}
        title="Admin Portal"
        subtitle="Sign in to manage the organization"
      />
    </BrowserRouter>
  );
};

describe('LoginForm Component — Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email and password input fields', () => {
    renderLoginForm();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('should render Sign In submit button', () => {
    renderLoginForm();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show title prop text', () => {
    renderLoginForm();
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
  });

  it('should show subtitle prop text', () => {
    renderLoginForm();
    expect(screen.getByText('Sign in to manage the organization')).toBeInTheDocument();
  });

  it('should toggle password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderLoginForm();
    const passwordInput = screen.getByPlaceholderText(/password/i);
    expect(passwordInput.type).toBe('password');
    const toggleBtn = screen.getByRole('button', { name: '' }); // eye button has no text
    await user.click(toggleBtn);
    expect(passwordInput.type).toBe('text');
  });

  it('should call login with email, password and role_type on form submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ role: 'ADMIN' });
    renderLoginForm('admin');
    await user.type(screen.getByPlaceholderText(/email/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123', 'admin');
  });
});
