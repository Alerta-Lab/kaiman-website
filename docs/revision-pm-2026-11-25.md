# Revisión de observaciones del sitio y registro

Fecha de verificación: 25 de noviembre de 2026.

## Cambios de landing y blog

- El importador y el guardado separan los prefijos de metadatos de sus valores. El layout limpia también los títulos y descripciones anteriores al renderizar `title`, Open Graph y Twitter. BlogPosting usa la descripción limpia.
- Se identificó el artículo español `marketing-interno-ia-consistencia-de-marca` con `seo_title` guardado como `META TITLE:` seguido del título en otro párrafo. La corrección de renderizado funciona sin reimportar ni modificar el cuerpo del artículo.
- La búsqueda pública y administrativa normaliza mayúsculas y acentos en ambos lados. PostgreSQL usa normalización Unicode nativa, sin instalar extensiones ni cambiar el esquema. Los caracteres `%` y `_` se buscan literalmente.
- Ayuda conduce a las preguntas frecuentes del idioma actual, en la misma pestaña.
- La landing distingue los siete tipos de generación de los ejemplos de capacidades comerciales. Se retiró la referencia numérica a ocho cuentas y facturas de la comparación de herramientas.
- Se mantienen los códigos existentes: Starter `start`, Pro `pro` y Business `scale`. Son identificadores del catálogo, no los nombres que deben mostrarse al visitante.

## Registro en el frontend del software

El cambio está en el repositorio separado `C:\dev\Wizard-AI-FrontEnd`, en `components/auth/AuthAmbientShell.tsx` y las traducciones de `common.json`.

El logo compartido por registro, login y recuperación enlaza a `https://www.kaimanstudio.ai/es/` o `/en/`, según el idioma activo. No cambia el flujo de autenticación ni selecciona o compra suscripciones. Estos archivos requieren el despliegue del frontend del software.

## Pendiente del backend del chat para el PM

Se probó directamente `POST https://wizard-ai-api.com/api/public/kaiman/chat` con dos sesiones nuevas, sin JWT, en español e inglés. Ambas solicitudes devolvieron HTTP 200 y los nombres Starter, Pro y Business, pero indicaron que no disponen de los precios mensuales.

Preguntas reproducibles:

- `¿Cuáles son los planes y precios mensuales de Kaiman?`
- `What are Kaiman plans and monthly prices?`

La fuente local del backend `AI-Software/knowledge/kaiman-plans-credits.md` incluye los nombres y códigos de los planes, remite los cupos a los metadatos de Stripe y prohíbe inventar precios ausentes. No incluye los importes. Esto coincide con la respuesta observada. No se ha modificado el repositorio del backend.

Acción solicitada al PM/backend: incorporar el catálogo público confirmado a la fuente de conocimiento del chat, reconstruir o actualizar el índice según su proceso y desplegar. La landing utiliza actualmente esta tabla, centralizada en `src/lib/plans.ts`:

| Plan | Código | USD/mes | Créditos/mes | Plazas | Almacenamiento |
| --- | --- | ---: | ---: | ---: | ---: |
| Starter | start | 49 | 500 | 1 | 1 GB |
| Pro | pro | 99 | 1500 | 3 | 3 GB |
| Business | scale | 199 | 2500 | 5 | 5 GB |

Confirmar la tabla contra el catálogo vigente de facturación antes de indexarla. La respuesta al visitante debe distinguir suscripciones de packs extra y usar los nombres comerciales. La prueba gratis publicada es de 14 días y 300 créditos.

Criterio de cierre: repetir las dos preguntas y comprobar importes, moneda y periodicidad correctos; después preguntar por un plan concreto con el mismo `session_id`. No se sustituye ni se altera desde el frontend el texto de la respuesta del backend para ocultar esta carencia.

## Validación

- Vitest: 67 pruebas aprobadas y 2 integraciones de Word omitidas por no configurar las rutas de documentos.
- Consulta temporal de solo lectura en Neon: `barbería`, `barberia` y texto con acento Unicode descompuesto encuentran los mismos registros; `%` se interpreta literalmente.
- Navegador a 390 px: título y `og:title` del artículo afectado sin rótulos, búsqueda con/sin tilde con resultados idénticos, Ayuda hacia FAQ en ES/EN y tipos de generación identificados como siete.
- Componente real del registro montado con dependencias visuales simuladas: logo enlaza a ES/EN al cambiar idioma y recibe foco por teclado. No se crearon cuentas ni se probó checkout o selección efectiva de un plan.
- TypeScript del frontend del software: `tsc --noEmit --incremental false` finaliza sin errores.
- No se publicaron cambios ni se modificaron datos del blog o el repositorio del backend.
