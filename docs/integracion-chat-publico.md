# Integración del chat público para frontend

La landing tiene un intermediario de servidor en `POST /api/public/chat`. No requiere sesión de administrador ni JWT. Esta ruta necesita el despliegue Astro con servidor (Vercel); la compilación estática de GitHub Pages no incluye las rutas API.

## Solicitud

```http
POST /api/public/chat
Content-Type: application/json
```

```json
{ "message": "¿Qué puedo hacer con Kaiman?", "locale": "es" }
```

`message` es obligatorio (1–2000 caracteres después de quitar espacios); `locale` es `es` o `en` y por defecto `es`. En los siguientes mensajes, enviar `session_id` con el valor devuelto por la última respuesta. El cuerpo admite hasta 8 KiB y no acepta campos adicionales.

```json
{ "message": "¿Y puedo crear anuncios?", "locale": "es", "session_id": "<session_id>" }
```

## Respuesta

```json
{ "role": "assistant", "content": "...", "session_id": "<session_id>", "sources": ["Video Editor"] }
```

El cliente conserva el identificador durante la conversación y permite iniciar una nueva descartándolo. El alcance de almacenamiento entre recargas es una decisión de UI; no asumir que el backend garantiza una duración o memoria específicas. Las fuentes son títulos legibles, no enlaces públicos. Mostrar el contenido como texto o Markdown sanitizado, sin interpretar HTML arbitrario.

La respuesta es `Cache-Control: no-store`. Los errores son JSON con `error` y `code`:

| HTTP | Código | Acción de interfaz sugerida |
| --- | --- | --- |
| 400, 413, 415 | `invalid_request` | Indicar que revise el mensaje. |
| 429 | `rate_limited` | Indicar que espere; respetar `Retry-After` si está presente. |
| 502 | `upstream_unavailable` o `invalid_upstream_response` | Informar que el chat no está disponible y permitir reintentar. |
| 504 | `timeout` | Informar la demora y permitir reintentar manualmente. |

No reintentar automáticamente: el servidor no puede saber si una petición que agotó el tiempo fue procesada. El intermediario no proporciona una protección propia de cuota distribuida; el límite del backend podría aplicarse a la IP compartida del servidor. Confirmar con backend el alcance y la configuración del rate limit antes de lanzar a producción.

## Configuración del servidor

La ruta llama a `https://wizard-ai-api.com/api/public/kaiman/chat`. Si el backend activa una clave, configurar `KAIMAN_PUBLIC_CHAT_API_KEY` como secreto del servidor; se envía mediante `X-Kaiman-Public-Chat-Key`. No exponerla al navegador ni usar `OPENAI_API_KEY` para este servicio. Una clave inválida o un error de autorización del backend se traduce en 502 sin revelar detalles.

## Estado y pendientes

En el smoke posterior al hotfix del 6 de noviembre, los ejemplos de seguimiento sobre videos y anuncios conservaron el tema, los planes se respondieron como Starter / Pro / Business y las fuentes fueron títulos legibles. Son títulos, no URLs. La muestra no confirma cada capacidad ni el comportamiento bajo carga o al expirar la sesión. Backend comunica un TTL aproximado de 30 minutos y hasta 12 turnos; no se han verificado esos límites. Ver [evaluación](chat-publico-evaluacion.md) y [ticket](tickets/backend/chat-publico-sesion-sin-contexto-2026-11-04.md).
