import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
  if (!DATABASE_URL) return res.status(500).json({ success: false, message: 'DB indisponível' });
  const sql = neon(DATABASE_URL);

  if (req.method === 'GET') {
    try {
      const users = await sql`SELECT id, name, email, role, created_at as "createdAt" FROM users`;
      return res.json({ success: true, users });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar usuários.' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, role } = req.body as { id: string; role: 'admin' | 'user' };
      await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Erro ao atualizar função.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body as { id: string };
      await sql`DELETE FROM users WHERE id = ${id}`;
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Erro ao excluir usuário.' });
    }
  }

  return res.status(405).json({ success: false });
}
