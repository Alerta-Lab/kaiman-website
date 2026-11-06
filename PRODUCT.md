# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary visitors explore Kaiman Studio on the marketing landing (es/en) and read bilingual blog guidance on design, product, and AI. A second audience is the internal administrator who imports weekly Word documents, reviews and accepts AI-assisted drafts, generates cover and in-article images, publishes Markdown posts, tags media, and reviews analytics.

## Product Purpose

Kaiman Studio’s public site combines a branded landing with a content blog and admin CMS. The landing persuades and routes into the product; the blog educates in Spanish and English under `/[locale]/blogs`. Success means clear bilingual reading, a reliable publishing/translation workflow, and measurable traffic—without inventing ranking guarantees.

## Positioning

One Astro app: marketing landing + Markdown-canonical blog in Neon + Vercel Blob media + GA4 + multi-topic Word import → linked drafts, **Traducir** via gpt-4o-mini and image generation via gpt-image-2—not a multi-author community CMS.

## Operating Context

Public: `/` → `/es/`, `/[locale]/` landing, `/[locale]/blogs` list, `/[locale]/blogs/[slug]` articles, category and search under the same prefix. Admin: `/admin` (unprefixed), including `/admin/posts` and `/admin/importar`. External auth: `https://app.kaimanstudio.ai/auth/login` and `/auth/register`.

## Capabilities and Constraints

- Confirmed: landing i18n es/en, public blog pages, secure single-admin auth, posts/tags/media CRUD, locale-paired posts with Traducir (gpt-4o-mini → draft sibling, never overwrites an existing sibling), SEO/sitemap/RSS, GA4 hooks, single-article Word import to draft, AI draft generation from instructions.
- Editorial flow (local branch, not yet deployed): multi-topic Word preview without AI → save each topic as linked drafts → optional translation → explicit content acceptance (not publication; editing invalidates it) → cover (16:9) and in-article (9:16 or 3:2) images with gpt-image-2, stored in public Blob → manual publish. Image prompts, alt texts and captions from the Word are kept as editorial data.
- Stack: Astro SSR + Vercel, React islands, TypeScript, Tailwind tokens, Lucide, Neon, Blob, Drizzle.
- Constraints: one seeded admin for v1; admin `noindex`; AI never auto-publishes; paid AI actions run only on explicit request; WCAG 2.2 AA on primary flows.
- Known limits: draft images are reachable by URL (public Blob); login rate limit is in-memory per instance; the legacy single-article importer shares `BLOB_READ_WRITE_TOKEN` with the public image store.
- Open: AI-suggested categories/tags; public chat orb (backend contract unconfirmed); private storage for drafts; legacy URL redirects; multi-admin roles; production domain finalization beyond env.

## Brand Commitments

- Names: Kaiman, Kaiman Blog, Kaiman Studio.
- Landing voice and dark ink surfaces; blog Quiet Signal reading surface with Wizard violet.
- Fonts: Space Grotesk + Quicksand. Public CTAs keep app.kaimanstudio.ai URLs.

## Product Principles

1. Brand and product entry stay visible; blog serves Kaiman Studio.
2. Publishing stays reviewable: AI drafts (import, generation or Traducir) and generated images never auto-publish.
3. Readers can switch es ↔ en on blog paths; missing sibling falls back to the other locale’s index.
4. Measure what the stack can prove; do not claim SEO placement.
5. Separate public reading from admin without leaking secrets.

## Accessibility & Inclusion

WCAG 2.2 AA on primary public and admin flows: focus, labels, contrast, keyboard, semantics.
