import { config } from 'dotenv';
import { hash } from '@node-rs/argon2';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../src/server/db/schema';

config({ path: '.env' });

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!DATABASE_URL || DATABASE_URL.includes('user:password@host')) {
	throw new Error(
		'DATABASE_URL no está configurada. Edita .env con la connection string de Neon.',
	);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias en .env.');
}
if (ADMIN_PASSWORD.length < 12) {
	throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
}

const db = drizzle(neon(DATABASE_URL));
await db
	.insert(users)
	.values({ email: ADMIN_EMAIL.toLowerCase().trim(), passwordHash: await hash(ADMIN_PASSWORD) })
	.onConflictDoNothing({ target: users.email });

console.log(`Administrador listo: ${ADMIN_EMAIL.toLowerCase().trim()}`);
