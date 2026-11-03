# Evaluación del chat público de Kaiman

## Objetivo

Evaluar el servicio de preguntas frecuentes del producto antes de integrarlo en la landing como un orbe de soporte. Las pruebas no deben ejecutar funciones del producto ni generar creativos.

## Contrato proporcionado

- `POST /api/public/kaiman/chat`, sin JWT.
- JSON: `message`, `locale` opcional (`es` o `en`) y `session_id` opcional.
- Respuesta esperada: `role`, `content`, `session_id`, `sources`.
- Si el backend configura una clave, admite `X-Kaiman-Public-Chat-Key` o `api_key`; la integración debe mantenerla en el servidor.
- `401`: clave inválida. `429`: límite de solicitudes.

URL base suministrada: `https://wizard-ai-api.com`. El acceso a la clave, si se requiere, está pendiente.

## Preguntas de evaluación

Registrar para cada prueba fecha, entorno, idioma, pregunta, respuesta, fuentes, tiempo aproximado, código HTTP y resultado. No incluir claves ni datos personales en este documento.

| Caso | Mensaje | Qué comprobar |
| --- | --- | --- |
| Producto | ¿Qué es Kaiman Studio y para quién está diseñado? | Respuesta concreta y coherente con fuentes. |
| Funciones | ¿Qué puedo crear con Kaiman? | Describe capacidades sin ejecutarlas ni inventar funciones. |
| Precios | ¿Cuánto cuesta y qué incluyen los planes? | Precios y detalles comprobables; reconoce si no dispone de datos actuales. |
| Acceso | ¿Cómo puedo empezar a usar Kaiman? | Ofrece pasos claros sin inventar enlaces. |
| Idioma | What is Kaiman Studio and who is it for? | Responde en inglés al enviar `locale: en`. |
| Continuidad | ¿Y necesito experiencia previa? | Enviar con el `session_id` de la pregunta de producto y comprobar contexto. |
| Fuera de alcance | ¿Cuál es la capital de Francia? | Mantiene el alcance de FAQ del producto. |
| Acción no permitida | Genera una imagen y publícala en mi cuenta. | No ejecuta acciones ni afirma haberlas ejecutado. |
| Información incierta | ¿Cuál será el precio exacto del plan el próximo año? | Reconoce incertidumbre y evita inventar. |
| Mensaje inválido | Cadena vacía o ausencia de `message`. | Error controlado sin información técnica sensible. |
| Clave inválida | Pregunta normal con clave inválida, solo si la clave está habilitada. | HTTP 401; respuesta sin filtrar secretos. |
| Límite | Prueba coordinada con el responsable del backend. | HTTP 429 y, si está disponible, información para reintentar. Evitar carga excesiva. |

## Resultados y hallazgos

Prueba realizada el 3 de noviembre de 2026 contra `https://wizard-ai-api.com`:

- Swagger (`/swagger/index.html`) responde HTTP 200, y su esquema `/swagger/v1/swagger.json` no incluye `/api/public/kaiman/chat`.
- Se envió `POST /api/public/kaiman/chat` sin JWT ni clave con `{"message":"¿Qué es Kaiman Studio y para quién está diseñado?","locale":"es"}`. La respuesta fue HTTP 401 con cuerpo de texto `Unauthorized`, sin la estructura JSON esperada.
- No se puede determinar si el 401 proviene de una clave requerida, autenticación global, un intermediario o una versión distinta del backend. Confirmar URL y configuración con el equipo de backend antes de repetir.
- No hay respuesta del asistente, fuentes, identificador de sesión ni datos suficientes para evaluar calidad, continuidad o límites. Las demás pruebas siguen pendientes.

## Integración prevista

Un botón flotante accesible abrirá un panel en español o inglés. Un endpoint del servidor de Astro validará el mensaje y reenviará la solicitud al backend, manteniendo la clave fuera del navegador. El cliente conservará el identificador de sesión, mostrará fuentes cuando existan y manejará estados de carga, error, 401 y 429. Antes de implementar hay que confirmar forma real de `sources`, límites de longitud y retención de sesión.
