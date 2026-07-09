import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { env } from '@/lib/env';

const client = new Database(env.DATABASE_URL.replace('sqlite:', ''));

export const db = drizzle(client);
export { client as pool };
