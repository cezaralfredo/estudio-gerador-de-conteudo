import { User } from '../types';
import { sql } from './db';
import bcrypt from 'bcryptjs';

const CURRENT_USER_KEY = 'NEXUS_CURRENT_SESSION';

export const AuthService = {
  // Inicializa o banco de dados (não é mais necessário inicializar dados locais)
  init: () => {
    // Pode verificar conexão ou algo do tipo se necessário
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const users = await sql`SELECT id, name, email, role, created_at as "createdAt" FROM users`;
      return users as unknown as User[];
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  },

  register: async (name: string, email: string, pass: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      // Check if user exists
      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        return { success: false, message: 'Este e-mail já está cadastrado.' };
      }

      // Create user
      // Hash de senha no cliente (melhor do que plaintext; ideal é no servidor)
      const passwordHash = await bcrypt.hash(pass, 10);
      const [newUser] = await sql`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (${name}, ${email}, ${passwordHash}, 'user')
        RETURNING id, name, email, role, created_at as "createdAt"
      `;

      const user: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as 'user' | 'admin',
        createdAt: newUser.createdAt
      };

      // Auto login
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      console.error("Erro ao registrar:", error);
      return { success: false, message: 'Erro ao criar conta. Tente novamente.' };
    }
  },

  login: async (email: string, pass: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const rows = await sql`
        SELECT id, name, email, role, created_at as "createdAt", password_hash 
        FROM users 
        WHERE email = ${email}
      `;

      if (rows.length === 0) {
        return { success: false, message: 'Credenciais inválidas.' };
      }

      const row = rows[0] as any;
      let passwordMatch = false;
      try {
        passwordMatch = await bcrypt.compare(pass, row.password_hash);
      } catch (_) {
        passwordMatch = false;
      }
      // Fallback: se o banco possuir senhas em plaintext, aceite e faça upgrade para hash
      if (!passwordMatch && row.password_hash === pass) {
        const newHash = await bcrypt.hash(pass, 10);
        await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${row.id}`;
        passwordMatch = true;
      }
      if (!passwordMatch) {
        return { success: false, message: 'Credenciais inválidas.' };
      }

      const user: User = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        createdAt: row.createdAt
      };

      // Update last login
      await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      console.error("Erro ao login:", error);
      return { success: false, message: 'Erro ao conectar ao servidor.' };
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
      await sql`DELETE FROM users WHERE id = ${id}`;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateUserRole: async (id: string, role: 'admin' | 'user'): Promise<boolean> => {
    try {
      await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};