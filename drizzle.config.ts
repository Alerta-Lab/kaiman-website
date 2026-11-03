import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

// Migraciones: conexión directa (sin pooler). App: DATABASE_URL pooled.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.includes('placeholder') || databaseUrl.includes('user:password@host')) {
	throw new Error(
		'DATABASE_URL no está configurada. Copia .env.example a .env y pega la connection string de Neon (Vercel Marketplace → Storage → Neon).',
	);
}

export default defineConfig({
	schema: './src/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: databaseUrl,
	},
	strict: true,
});
