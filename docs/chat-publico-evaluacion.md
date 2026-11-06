# Evaluación del chat público de Kaiman

## Objetivo

Evaluar el servicio de preguntas frecuentes del producto antes de integrarlo en la landing como un orbe de soporte. Las pruebas no deben ejecutar funciones del producto ni generar creativos.

## Contrato proporcionado

- `POST /api/public/kaiman/chat`, sin JWT.
- JSON: `message`, `locale` opcional (`es` o `en`) y `session_id` opcional.
- Respuesta esperada: `role`, `content`, `session_id`, `sources`.
- Si el backend configura una clave, admite `X-Kaiman-Public-Chat-Key` o `api_key`; la integración debe mantenerla en el servidor.
- `401`: clave inválida. `429`: límite de solicitudes.

URL base suministrada: `https://wizard-ai-api.com`. En la prueba del 4 de noviembre de 2026 el endpoint respondió sin JWT y sin clave.

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

### Smoke del 6 de noviembre de 2026 después del hotfix

**Dos sesiones simultáneas:** se iniciaron en paralelo una conversación sobre videos y otra sobre anuncios, y se enviaron en paralelo dos seguimientos por conversación a través del proxy local. Los seis turnos respondieron HTTP 200; las sesiones iniciales tuvieron identificadores distintos y cada seguimiento conservó el suyo. Las respuestas permanecieron en el tema esperado en esta muestra. Esto no demuestra aislamiento de datos ni cubre múltiples instancias, expiración o concurrencia a escala.

Se probaron seis turnos a través de `/api/public/chat` en el servidor local, conectado al backend público. Todos respondieron HTTP 200; los tres seguimientos conservaron el `session_id`.

- Videos → «¿Puedo hacerlos a partir de una imagen?» → «¿Y agregarles narración?»: ambas respuestas mantuvieron el tema de video; la última mencionó narración desde Video Editor.
- Anuncios → «¿Y puedo publicarlos directamente desde ahí?»: respondió sobre publicación en redes desde Publish y aclaró que no podía confirmar publicación automática en Meta o Google.
- Planes: respondió Starter, Pro y Business, sin confirmar precios ni asignaciones exactas.
- `sources` devolvió títulos legibles como «Video Editor» y preguntas frecuentes, no URLs. Algunos títulos eran genéricos o aparentemente poco relacionados; no se evaluó su contenido.

Los ejemplos del ticket pasan esta muestra de contexto y nombres de planes. Esto no verifica de forma independiente que cada capacidad o precio declarado sea correcto, ni cubre concurrencia, expiración de sesión o carga.

### Retest del 6 de noviembre de 2026

**Prueba adicional orientada al uso real:** se realizaron tres conversaciones sobre anuncios, videos e imágenes, con seguimientos breves y el `session_id` devuelto. Los diez turnos respondieron HTTP 200 y los siete seguimientos conservaron el identificador. Tras preguntar si Kaiman crea videos, «¿Puedo hacerlos a partir de una imagen?» obtuvo instrucciones para editar imágenes; «¿Y agregarles narración?» respondió sobre informes y añadir narración a una imagen. En otra conversación sobre anuncios, «¿Y puedo publicarlos directamente desde ahí?» contestó sobre publicar sitios. Algunas preguntas de seguimiento obtuvieron respuestas pertinentes, pero no bastan para verificar exactitud funcional. Estos ejemplos muestran pérdida o ambigüedad de contexto que afecta el uso esperado; no demuestran su causa. Se necesita confirmar las capacidades reales con la fuente oficial del producto.

Se realizaron ocho solicitudes consecutivas a producción sin JWT ni clave, usando un negocio ficticio. Los tiempos observados fueron de 0,12 a 3,7 segundos; esta muestra no representa una prueba de carga.

| Caso | Resultado observado |
| --- | --- |
| Producto en español e inglés | HTTP 200, respuesta en el idioma solicitado, `role: assistant`, `session_id` y `sources`. |
| Continuidad | El primer turno mencionó Café Cedro. En el segundo se envió el `session_id` recibido y se conservó el mismo identificador, pero el asistente dijo que no sabía el nombre. La persistencia del identificador funciona en esta muestra; el recuerdo conversacional sigue sin demostrarse. |
| Fuera de alcance | HTTP 200; rechazó responder cuál es la capital de Francia y ofreció información de Kaiman. Mejora frente a la prueba del 4 de noviembre. |
| Ejecutar acciones | HTTP 200; indicó que no podía generar ni publicar imágenes desde el chat. No se verificaron efectos internos. |
| Precios | HTTP 200; mencionó Basic, Medium y Premium y no confirmó importes. La configuración de esta landing contiene Start, Pro y Scale; confirmar el catálogo vigente y actualizar la fuente que corresponda. |
| Mensaje vacío | HTTP 400 con `message is required.` |

Las fuentes siguen siendo identificadores internos, no enlaces públicos. No se probaron límite 429, clave inválida, carga, persistencia tras recargar ni el widget de la landing. El chat todavía no está integrado.

### Retest del 4 de noviembre de 2026

**Ampliación:** el campo `session_id` del contrato comunicado devolvió sesiones nuevas en seguimientos. En pruebas de control, `sessionId` conservó el mismo identificador, pero el asistente tampoco recordó un nombre de negocio ficticio mencionado en el turno anterior. Evidencia y pasos para backend: [ticket de sesión](tickets/backend/chat-publico-sesion-sin-contexto-2026-11-04.md).

Se enviaron preguntas reales sin JWT ni clave. Las respuestas exitosas llegaron en aproximadamente 1,6–4,3 segundos en esta muestra; no es una medición de rendimiento representativa.

| Caso | Resultado observado |
| --- | --- |
| Producto en español | HTTP 200, con `role`, contenido, identificador de sesión y fuentes. Las respuestas describieron capacidades generales, aunque una reconoció no conocer todos los detalles. |
| Producto en inglés | HTTP 200 y respuesta en inglés. |
| Continuidad | **Fallo observado:** se envió el `session_id` devuelto por la primera respuesta y el servidor devolvió uno nuevo. En una segunda comprobación, tras mencionar el negocio ficticio «Cafetería Limonar», el seguimiento no recordó el nombre. No se ha determinado la causa. |
| Fuera de alcance | **Fallo frente al alcance esperado:** preguntado por la capital de Francia, respondió «París», en lugar de limitarse a FAQ de Kaiman. |
| Ejecutar acciones | HTTP 200; indicó que no podía generar ni publicar una imagen desde el chat. No se verificaron efectos internos más allá de la respuesta. |
| Precios | HTTP 200; dijo no conocer precios exactos y mencionó Basic, Medium y Premium. El catálogo local del sitio usa otros nombres; confirmar el catálogo vigente antes de mostrarlo como información fiable. |
| Mensaje vacío | HTTP 400 con `{"error":"message is required."}`. |

Las fuentes se devolvieron como nombres internos como `knowledge/kaiman-faq.md` o `pricing:ad_images`, no como URLs públicas. En algunas preguntas aparecieron nombres de documentos técnicos aparentemente poco relacionados; no se ha comprobado su contenido ni su relevancia real. Antes de mostrar fuentes como enlaces se necesita un contrato de fuentes públicas o una decisión de interfaz.

No se probaron `429`, clave inválida ni carga; requieren una prueba coordinada. El chat no está integrado en la landing.

### Prueba anterior del 3 de noviembre de 2026

Prueba realizada el 3 de noviembre de 2026 contra `https://wizard-ai-api.com`:

- Swagger (`/swagger/index.html`) responde HTTP 200, y su esquema `/swagger/v1/swagger.json` no incluye `/api/public/kaiman/chat`.
- Se envió `POST /api/public/kaiman/chat` sin JWT ni clave con `{"message":"¿Qué es Kaiman Studio y para quién está diseñado?","locale":"es"}`. La respuesta fue HTTP 401 con cuerpo de texto `Unauthorized`, sin la estructura JSON esperada.
- No se puede determinar si el 401 proviene de una clave requerida, autenticación global, un intermediario o una versión distinta del backend. Confirmar URL y configuración con el equipo de backend antes de repetir.
- No hay respuesta del asistente, fuentes, identificador de sesión ni datos suficientes para evaluar calidad, continuidad o límites. Las demás pruebas siguen pendientes.

## Integración prevista

Un botón flotante accesible abrirá un panel en español o inglés. Un endpoint del servidor de Astro validará el mensaje y reenviará la solicitud al backend, manteniendo cualquier clave fuera del navegador. El cliente deberá conservar el identificador de sesión, pero la continuidad debe corregirse o aclararse en backend antes de considerarla funcional. Las fuentes recibidas no son enlaces públicos; definir cómo presentarlas. El panel deberá manejar carga, error, 401 y 429 y no prometer acciones que el chat no ejecuta.
