import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { getEnv } from '../env';
import * as schema from './schema';

neonConfig.webSocketConstructor = ws;

type Database = NeonDatabase<typeof schema>;

let pool: Pool | undefined;
let cached: Database | null | undefined;

export function getDb(): Database | null {
	if (cached !== undefined) return cached;
	const databaseUrl = getEnv('DATABASE_URL');
	if (!databaseUrl) {
		cached = null;
		return cached;
	}
	pool = new Pool({ connectionString: databaseUrl });
	cached = drizzle(pool, { schema });
	return cached;
}

export const hasDatabase = () => Boolean(getEnv('DATABASE_URL'));

export function requireDb() {
	const db = getDb();
	if (!db) {
		throw new Error('DATABASE_URL no está configurada en el entorno del servidor.');
	}
	return db;
}
