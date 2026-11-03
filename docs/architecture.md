# Arquitectura y operación

## Flujo de contenido

El panel valida los datos de entrada con Zod y persiste Markdown y datos editoriales en Neon. Las etiquetas se normalizan y crean al guardar. Las imágenes generadas se guardan en Vercel Blob público. La vista previa nueva de Word procesa el `.docx` en el servidor mediante Mammoth, sin guardarlo como archivo en Blob ni llamar a OpenAI.

La ruta anterior de importación de un solo artículo sí utiliza OpenAI y un Blob privado temporal; actualmente comparte el nombre de variable del token con el Blob público, por lo que necesita configuración separada antes de usar ambos almacenes. El administrador revisa los borradores y decide publicar. La llamada de importación anterior usa `store: false` y trata de eliminar el archivo remoto al terminar.

## Caché y picos

Las páginas públicas envían `s-maxage=300, stale-while-revalidate=86400`; Vercel puede servir lecturas repetidas desde CDN. Neon usa un pool serverless y las consultas están indexadas por slug/estado/fecha. El límite de intentos de login actual vive en memoria y no se comparte entre instancias.

## Despliegue

1. Crear Neon en Vercel Marketplace en la misma región de cómputo.
2. Conectar un Blob público para imágenes. Si se usa el importador anterior, configurar y adaptar por separado el acceso al Blob privado; el código actual no distingue ambos tokens.
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
