import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('Missing VITE_DATABASE_URL');
}

export const sql = neon(DATABASE_URL);
