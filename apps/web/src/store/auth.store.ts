import { create } from 'zustand';

interface AuthUser {
  username: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export function isValidAuthToken(token: string | null): boolean {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return false;
  }

  if (token.length < 10 || token.length > 2048) {
    return false;
  }

  return /^[A-Za-z0-9\-_.~+/]+=*$/.test(token);
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: loadUser(),
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
