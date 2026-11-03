# Arquitectura y operación

## Flujo de contenido

El panel valida todos los campos con Zod y persiste Markdown canónico en Neon. Las etiquetas se normalizan y crean al guardar. Las imágenes públicas viven en Vercel Blob; los documentos Word importados se guardan temporalmente en Blob privado, se analizan con OpenAI y se eliminan al terminar.

OpenAI genera exclusivamente un borrador estructurado. El administrador revisa y decide publicar. Las respuestas se solicitan con `store: false` y el archivo remoto se elimina.

## Caché y picos

Las páginas públicas envían `s-maxage=300, stale-while-revalidate=86400`; Vercel absorbe lecturas repetidas en CDN. Neon usa su conexión HTTP serverless y las consultas están indexadas por slug/estado/fecha. Si aparecen límites reales, se añadirá invalidación por tag y Upstash para rate limit distribuido; no se incorpora antes de medir.

## Despliegue

1. Crear Neon en Vercel Marketplace en la misma región de cómputo.
2. Crear un Blob público para imágenes y uno privado para importaciones. El token configurado debe corresponder al store usado por cada entorno.
3. Configurar las variables de `.env.example` en Development, Preview y Production.
4. Ejecutar migraciones con `pnpm db:migrate` y el seed con `pnpm seed:admin`.
5. Conectar el repositorio a Vercel y validar `/`, `/admin/login`, `/sitemap.xml` y `/robots.txt`.

Backups y point-in-time recovery se configuran en Neon. Antes de una migración destructiva, crear una rama/snapshot de base de datos. Un rollback de aplicación se hace promoviendo el deployment anterior de Vercel; el rollback de esquema requiere una migración explícita.

## Google

La cuenta de servicio necesita rol Viewer en la propiedad GA4. `GOOGLE_SERVICE_ACCOUNT_JSON` contiene el JSON completo como secreto. Vincular la propiedad de Search Console al stream web de GA4 y enviar `/sitemap.xml`.

SEO técnico mejora rastreo, presentación y rendimiento, pero no garantiza posiciones. Evaluar mensualmente páginas indexadas, impresiones, CTR, posición media, tráfico orgánico y Core Web Vitals. SEM es publicidad pagada: usar UTMs y eventos de conversión; presupuesto, pujas y campañas se gestionan fuera de este repositorio.

## Seguridad

- Rotar `ADMIN_PASSWORD`, claves OpenAI/Google y Blob ante cualquier exposición.
- El panel y API requieren sesión; el middleware aplica cabeceras defensivas.
- El Markdown se transforma con `rehype-sanitize`.
- Los uploads validan extensión, MIME y tamaño.
- Revisar el audit log y añadir alertas de plataforma antes de incorporar más administradores.
