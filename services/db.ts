import { neon } from '@neondatabase/serverless';

// In a real production app, this should be in an environment variable.
// Since we are in a dev environment and I cannot write to .env.local (gitignored),
// I will use the connection string directly here for now, or fallback to env var.
const DATABASE_URL = import.meta.env.VITE_DATABASE_URL || "postgresql://neondb_owner:npg_nRl8JQ2MPYqr@ep-lively-sound-aex0xb5q-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

export const sql = neon(DATABASE_URL);
