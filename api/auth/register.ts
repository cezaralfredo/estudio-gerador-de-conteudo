import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
  if (!DATABASE_URL) return res.status(500).json({ success: false, message: 'DB indisponível' });
  const sql = neon(DATABASE_URL);
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.json({ success: false, message: 'Este e-mail já está cadastrado.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, 'user')
      RETURNING id, name, email, role, created_at as "createdAt"
    `;
    return res.json({ success: true, user: newUser });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erro ao criar conta.' });
  }
}
