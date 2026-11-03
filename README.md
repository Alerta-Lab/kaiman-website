# landing-kaiman

Sitio unificado de **Kaiman Studio**: landing (`/[locale]/`) + blog (`/[locale]/blogs`) + CMS (`/admin`).

## Desarrollo

```bash
pnpm install
pnpm db:migrate
pnpm seed:admin
pnpm exec astro dev --background
```

Para gestionar el servidor: `pnpm exec astro dev status`, `pnpm exec astro dev logs` y `pnpm exec astro dev stop`.

- Landing: http://localhost:4321/es/
- Blog: http://localhost:4321/es/blogs
- Admin: http://localhost:4321/admin/login

Variables: copia `.env.example` → `.env` (Neon, Blob, OpenAI, GA, admin).

## Traducir artículos

En el editor de un post guardado, **Traducir** crea un borrador hermano en el otro idioma con `gpt-4o-mini` (mismo slug, `translationGroupId`). Revisar y publicar a mano.
Si ya existe una versión en el idioma de destino, no se reemplaza: ábrela desde el listado para editarla.

## Crear e importar borradores

En **Nuevo artículo**, escribe las instrucciones, selecciona el idioma y pulsa **Generar borrador**. El artículo generado se guarda como borrador para revisión. La importación de Word completa el editor en el idioma seleccionado; revisa los campos y pulsa **Guardar** para conservarlo. Ambas funciones requieren las credenciales correspondientes de `.env.example`.

### Word con varios artículos

En **Nuevo artículo → Revisar Word con varios artículos**, sube un `.docx` de hasta 4 MB. Revisa los campos detectados y guarda cada tema como borradores vinculados. Si falta un idioma, el editor del artículo guardado permite solicitar una traducción con IA. Para generar imágenes, guarda y acepta primero el texto; la generación consume créditos y almacena las imágenes en el Blob público configurado con `BLOB_READ_WRITE_TOKEN`. Quien tenga una URL puede verla aunque el artículo sea borrador. Las parejas antiguas guardadas en `public/blog-generated/` se pueden subir sin regenerarlas. La importación y las pruebas simuladas no consumen créditos.

Al guardar cada tema, la IA asigna una categoría (sector del negocio) y varias etiquetas (temas) a sus dos versiones; si ninguna categoría base encaja, crea una nueva. Se gestionan en `/admin/categorias` y en el editor.

El esquema necesita las migraciones `0002_post_editorial.sql` y `0003_categories.sql`. Los prompts, textos alternativos y pies de imagen del Word se conservan como datos editoriales; revisa los resultados antes de publicar.

Este repo sustituye a `blog-kaiman`.

El estado detallado, las pruebas y los pendientes están en [docs/estado-proyecto-blog-chat.md](docs/estado-proyecto-blog-chat.md).
