import { hash, verify } from '@node-rs/argon2';
import { and, eq, gt } from 'drizzle-orm';
import type { AstroCookies } from 'astro';
import { requireDb } from './db/client';
import { sessions, users } from './db/schema';
import { getEnv } from './env';

const COOKIE_NAME = 'kaiman_admin_session';
const SESSION_DAYS = 7;

const digest = async (value: string) => {
	const bytes = new TextEncoder().encode(value);
	const result = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const randomToken = () => {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

export async function createAdminFromEnv() {
	const email = getEnv('ADMIN_EMAIL')?.toLowerCase();
	const password = getEnv('ADMIN_PASSWORD');
	if (!email || !password) throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD.');
	const db = requireDb();
	const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
	if (existing) return existing;
	const [created] = await db
		.insert(users)
		.values({ email, passwordHash: await hash(password) })
		.returning();
	return created;
}

export async function login(email: string, password: string, cookies: AstroCookies) {
	const db = requireDb();
	const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
	if (!user || !(await verify(user.passwordHash, password))) return null;
	const token = randomToken();
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
	await db.insert(sessions).values({ userId: user.id, tokenHash: await digest(token), expiresAt });
	cookies.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		path: '/',
		expires: expiresAt,
	});
	return user;
}

export async function getSessionUser(cookies: AstroCookies) {
	const token = cookies.get(COOKIE_NAME)?.value;
	if (!token) return null;
	const db = requireDb();
	const [result] = await db
		.select({ id: users.id, email: users.email, name: users.name })
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(and(eq(sessions.tokenHash, await digest(token)), gt(sessions.expiresAt, new Date())))
		.limit(1);
	return result ?? null;
}

export async function logout(cookies: AstroCookies) {
	const token = cookies.get(COOKIE_NAME)?.value;
	if (token) await requireDb().delete(sessions).where(eq(sessions.tokenHash, await digest(token)));
	cookies.delete(COOKIE_NAME, { path: '/' });
}
