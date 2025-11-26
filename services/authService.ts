import { User } from '../types';
import bcrypt from 'bcryptjs';

const CURRENT_USER_KEY = 'NEXUS_CURRENT_SESSION';

export const AuthService = {
  // Inicializa o banco de dados (não é mais necessário inicializar dados locais)
  init: () => {
    // Pode verificar conexão ou algo do tipo se necessário
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      return (data?.users || []) as User[];
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },

  register: async (name: string, email: string, pass: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Falha ao registrar.' };
    } catch (error) {
      const userStr = localStorage.getItem(`USER_${email}`);
      if (userStr) {
        return { success: false, message: 'Este e-mail já está cadastrado.' };
      }
      const passwordHash = await bcrypt.hash(pass, 10);
      const user: User = { id: crypto.randomUUID(), name, email, role: 'user', createdAt: new Date().toISOString() } as User;
      localStorage.setItem(`USER_${email}`, JSON.stringify({ ...user, passwordHash }));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true, user };
    }
  },

  login: async (email: string, pass: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Credenciais inválidas.' };
    } catch (error) {
      const userStr = localStorage.getItem(`USER_${email}`);
      if (!userStr) return { success: false, message: 'Credenciais inválidas.' };
      const stored = JSON.parse(userStr);
      const ok = await bcrypt.compare(pass, stored.passwordHash).catch(() => false);
      if (!ok) return { success: false, message: 'Credenciais inválidas.' };
      const user: User = { id: stored.id, name: stored.name, email: stored.email, role: stored.role, createdAt: stored.createdAt };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true, user };
    }
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Admin methods
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      return Boolean(data?.success);
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateUserRole: async (id: string, role: 'admin' | 'user'): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role })
      });
      const data = await res.json();
      return Boolean(data?.success);
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
