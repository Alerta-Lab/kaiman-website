/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly DATABASE_URL?: string;
	readonly BLOB_READ_WRITE_TOKEN?: string;
	readonly OPENAI_API_KEY?: string;
	readonly OPENAI_MODEL?: string;
	readonly GA4_PROPERTY_ID?: string;
	readonly GOOGLE_SERVICE_ACCOUNT_JSON?: string;
	readonly PUBLIC_SITE_URL?: string;
	readonly PUBLIC_GA_MEASUREMENT_ID?: string;
	readonly ADMIN_EMAIL?: string;
	readonly ADMIN_PASSWORD?: string;
	readonly SESSION_SECRET?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare namespace App {
	interface Locals {
		admin: { id: string; email: string; name: string } | null;
	}
}
