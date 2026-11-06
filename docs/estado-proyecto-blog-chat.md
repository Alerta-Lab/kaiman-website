# Estado del sitio, el blog y el chat

Actualizado el 3 de noviembre de 2026. Este documento resume el trabajo local en la rama `codex/mejoras-blog-ia`. No implica que los cambios estén fusionados ni desplegados.

## Proyecto

Kaiman Studio reúne una landing bilingüe, un blog y un panel administrativo en una aplicación Astro con renderizado en servidor. Usa componentes React, TypeScript y Tailwind; Neon/PostgreSQL con Drizzle para datos; Vercel Blob para imágenes; OpenAI para funciones de IA; y Vercel como destino de despliegue. La aplicación principal de Kaiman y su backend de chat son servicios separados.

Rutas locales: landing `/es/`, blog `/es/blogs`, acceso `/admin/login`, lista editorial `/admin/posts` e importación `/admin/importar`.

## Flujo editorial disponible

1. En **Nuevo artículo → Revisar Word con varios artículos**, subir un `.docx` de hasta 4 MB. La lectura del formato estructurado es local y no usa créditos de OpenAI.
2. Revisar cada tema, sus versiones y los campos detectados. El editor permite modificar esos campos y guardar cada tema por separado como uno o dos borradores vinculados.
3. Si hay una sola versión, el editor ofrece crear la otra con IA. Si ya existe una versión hermana, no se ofrece traducirla y el servidor evita sobrescribirla. La traducción consume créditos y usa actualmente `gpt-4o-mini` configurado en código.
4. Revisar los campos, guardar y aceptar el contenido guardado. La aceptación no publica; editar y guardar de nuevo invalida la aceptación.
5. Generar portada e imagen interior desde el editor. Es una acción explícita que consume créditos. Las dos imágenes se generan de forma secuencial con `gpt-image-2`, calidad media, y se guardan en el Blob público. La portada usa 1536×864 (16:9); la interior 864×1536 (9:16) o 1536×1024 (3:2).
6. Revisar el resultado. El botón **Regenerar ambas imágenes** crea una nueva pareja y consume créditos nuevamente. Las imágenes anteriores permanecen en Blob y en medios; no hay regeneración individual ni selector de historial específico del artículo.
7. Seleccionar **Publicado** y guardar cuando el contenido y las imágenes estén listos. Las imágenes antiguas que solo existen en `public/blog-generated/` deben subirse a Blob antes de publicar. Si tienen URL de Blob, el bloqueo específico de imágenes locales ya no se aplica.

### Vista previa y borrado

- **Vista previa** (`/admin/posts/<id>/preview`, requiere sesión): muestra la última versión guardada, sea borrador o publicada, con el mismo componente que la página pública (`ArticleView.astro`). No se indexa ni se guarda en caché.
- En el listado, el título abre la página publicada si el artículo está publicado y la vista previa si es borrador. El editor tiene **Vista previa** y, si está publicado, **Ver página publicada**.
- En el listado, la selección múltiple permite **Publicar**, **Pasar a borrador** y **Eliminar**. Publicar aplica la misma regla que el editor: omite los artículos con imágenes que solo existen en `public/blog-generated/` y lo indica. Al volver a publicar se conserva la fecha original.
- Se puede eliminar desde el editor o desde el listado, uno a uno o seleccionando varios. Siempre pide confirmación y avisa si alguno está publicado. Borrar una versión no borra su versión hermana en el otro idioma. Las imágenes permanecen en Blob y en la biblioteca de medios.

### Avance y recuperación

El editor muestra generación por etapa, porcentaje real de subida de cada imagen, guardado y errores. OpenAI no proporciona un porcentaje real de generación en este flujo. El servicio envía eventos durante la solicitud y asocia las dos imágenes después de subirlas. Si falla el guardado, intenta eliminar los archivos recién subidos; los anteriores no se borran. Si se interrumpe la conexión, revisar el artículo antes de volver a intentar: el proceso podría haber continuado y el consumo de IA podría haberse producido.

El progreso y los errores tienen pruebas simuladas, pero **no se ha verificado una generación real de extremo a extremo desde el panel con este indicador de progreso**. Tampoco hay recuperación de tareas tras cerrar la página, cancelación fiable ni historial de trabajos.

## Documento Word y campos

El ejemplo revisado contiene cinco temas con dos versiones cada uno. El lector reconoce las secciones e idiomas del formato de ejemplo y mapea título, slug, entradilla, metadatos SEO, secciones, listas, FAQ, citas y CTA a campos y Markdown. Guarda los prompts y los alt y pies de imagen como datos editoriales; los prompts no forman parte del artículo público.

La detección de un documento sin etiquetas de idioma usa una heurística y requiere revisión. Otros formatos pueden no reconocerse o no preservar toda la estructura; no se debe asumir fidelidad total hasta comprobarlo con más documentos. El título SEO y la descripción SEO no se recortan por los antiguos umbrales de 60/160 caracteres. El título visible aún tiene un máximo de 120; si una validación falla, se debe corregir antes de guardar.

La revisión y guardado se hacen por tema; el sistema no implementa una importación masiva de todos los temas en un solo paso.

### Categorías y etiquetas

El Word no trae categorías ni etiquetas. Al guardar cada tema, la IA (gpt-4o-mini) asigna a sus dos versiones una **categoría** (el sector del negocio) y de 3 a 6 **etiquetas** (los temas). Elige entre las categorías existentes; si ninguna encaja, crea una nueva. Las 6 categorías base son: Restaurantes, Med spas y estética, Salones de belleza y uñas, Bufetes de abogados, Inmobiliarias y Agencias de marketing. Si la IA falla, los borradores se guardan igual, sin categoría. El editor permite cambiar la categoría y las etiquetas, o pedirlas de nuevo con **Sugerir categoría y etiquetas con IA**, que reemplaza las de todas las versiones. Las categorías se gestionan en `/admin/categorias`.

En el blog público, `/[locale]/blogs/categoria/<slug>` lista los artículos de una categoría y `/[locale]/blogs/etiqueta/<slug>` los de una etiqueta. Las URLs antiguas de etiqueta bajo `categoria` redirigen a `etiqueta`. Requiere la migración `0003_categories.sql`. El mapeo detallado y sus límites están en [flujo-importacion-blog.md](flujo-importacion-blog.md).

## Seguridad y datos

- Las credenciales van en `.env` local o en las variables secretas del despliegue; no se incluyen en documentación ni código cliente. `.env.example` contiene solo nombres y ejemplos.
- El Blob configurado para imágenes es **público**. Aunque un artículo esté en borrador, cualquiera con la URL puede ver sus imágenes. Si se necesita confidencialidad antes de publicar, falta implementar almacenamiento privado y un flujo de publicación apropiado.
- El importador anterior de un solo artículo usa Blob privado y la misma variable `BLOB_READ_WRITE_TOKEN`; un token de un almacén público no sustituye al de uno privado. La importación nueva por `/admin/importar` lee el `.docx` en el servidor sin ese paso, pero no guarda el Word original como archivo.
- El panel usa sesiones; el límite de intentos del login vive en memoria local y no es distribuido entre instancias. Sigue pendiente reforzarlo.
- La migración aditiva `0002_post_editorial.sql` se aplicó a la base Neon configurada en esta sesión. Otros entornos necesitan sus propias migraciones y una estrategia de respaldo.

## SEO e idiomas

El blog ya incluye metadatos SEO, canonical, Open Graph, sitemap, RSS y datos estructurados `BlogPosting`. Las versiones publicadas equivalentes se relacionan con `hreflang`; cuando falta una versión publicada no se apunta al índice como si fuera traducción. No se garantiza indexación ni posicionamiento.

Queda pendiente revisar redirecciones desde las URLs existentes del sitio anterior hacia `/[locale]/blogs/[slug]`, fuentes, autor, categoría principal y sugerencias de enlaces internos. El FAQ del Word se puede mostrar como contenido; no se debe prometer un resultado enriquecido de Google.

## Pruebas realizadas

- El Word real se analizó sin IA: cinco temas y diez versiones. Su importación autenticada de vista previa respondió correctamente.
- La conexión al Blob público se comprobó con un archivo temporal; se subieron las dos imágenes locales del borrador de prueba y ambas respondieron correctamente. Ese traslado no llamó a OpenAI.
- Se verificó la aceptación del borrador tras corregir la validación de concurrencia. Una prueba de inserción de borradores vinculados en Neon se revirtió mediante transacción.
- Se generaron imágenes de muestra con OpenAI y se revisó una dirección visual alternativa. La generación directa con API no equivale a una prueba completa del editor actual.
- Vitest pasó 18 pruebas cuando se indicó `TEST_WORD_PATH` con el documento real. Sin esa variable, como en la ejecución del 3 de noviembre de 2026, pasan 17 y la del Word real aparece como omitida. Los servicios de imagen y sus eventos se simularon en las pruebas automatizadas.
- `astro check` reportó 14 errores de tipos preexistentes en `src/scripts/landing-gsap.ts`. El build anterior no terminó el empaquetado de Vercel por permisos de enlaces simbólicos en Windows. No se ha completado una verificación de producción posterior.

## Chat público

El intermediario de servidor `POST /api/public/chat` está implementado y probado contra el servicio público. El orbe y el panel flotante viven en `src/components/chat/ChatOrb.tsx` (inferior derecho, junto a «Volver arriba»). El retest posterior al hotfix conservó el contexto en los ejemplos de anuncios y videos y devolvió títulos de fuentes legibles. Ver [guía para frontend](integracion-chat-publico.md) y [evaluación](chat-publico-evaluacion.md).

## Siguientes pasos

1. Validar el recorrido completo de importación, revisión, imágenes, regeneración y publicación en un entorno de prueba, con ejemplos reales y sin publicar contenido definitivo.
2. Confirmar el comportamiento de progreso y recuperación de fallos con una generación real y medir su consumo; evitar reintentos automáticos que gasten créditos.
3. Implementar y revisar sugerencias de categorías y etiquetas; decidir cómo se aprueban y evitar inventar fuentes o datos.
4. Resolver los errores existentes de Astro, repetir build y pruebas de accesibilidad, y revisar los límites de ejecución de Vercel para operaciones largas.
5. Confirmar el backend del chat y definir si los borradores y sus imágenes requieren almacenamiento privado.
