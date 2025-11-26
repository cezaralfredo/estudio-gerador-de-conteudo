import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
  if (!DATABASE_URL) return res.status(500).json({ success: false, message: 'DB indisponível' });
  const sql = neon(DATABASE_URL);
  try {
    const { email, password } = req.body as { email: string; password: string };
    const rows = await sql`
      SELECT id, name, email, role, created_at as "createdAt", password_hash
      FROM users WHERE email = ${email}
    `;
    if (rows.length === 0) {
      return res.json({ success: false, message: 'Credenciais inválidas.' });
    }
    const row = rows[0] as any;
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, row.password_hash);
    } catch (_) {
      passwordMatch = false;
    }
    if (!passwordMatch && row.password_hash === password) {
      const newHash = await bcrypt.hash(password, 10);
      await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${row.id}`;
      passwordMatch = true;
    }
    if (!passwordMatch) {
      return res.json({ success: false, message: 'Credenciais inválidas.' });
    }
    await sql`UPDATE users SET last_login = NOW() WHERE id = ${row.id}`;
    const user = { id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.createdAt };
    return res.json({ success: true, user });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erro ao conectar ao servidor.' });
  }
}
