# landing-kaiman

Sitio unificado de **Kaiman Studio**: landing (`/[locale]/`) + blog (`/[locale]/blogs`) + CMS (`/admin`).

## Desarrollo

```bash
pnpm install
pnpm db:migrate
pnpm seed:admin
pnpm dev
```

- Landing: http://localhost:4321/es/
- Blog: http://localhost:4321/es/blogs
- Admin: http://localhost:4321/admin/login

Variables: copia `.env.example` → `.env` (Neon, Blob, OpenAI, GA, admin).

## Traducir artículos

En el editor de un post guardado, **Traducir** crea un borrador hermano en el otro idioma con `gpt-4o-mini` (mismo slug, `translationGroupId`). Revisar y publicar a mano.

Este repo sustituye a `blog-kaiman`.
