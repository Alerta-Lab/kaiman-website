# Chat público: seguimientos pierden el contexto de funciones de Kaiman

> **Retest posterior al hotfix — 2026-11-06:** pasaron los ejemplos de seguimiento sobre video e imagen, narración y publicación de anuncios, y la respuesta de planes fue Starter / Pro / Business. Las fuentes devolvieron títulos legibles. Se probó mediante el proxy local y todos los turnos devolvieron HTTP 200 con el identificador de sesión conservado en seguimientos. Pendiente confirmar la exactitud funcional de las respuestas y verificar TTL, aislamiento y límites. El contenido de abajo describe la prueba anterior al hotfix.

**Fecha de prueba:** 2026-11-06  
**Repositorio responsable:** [Alerta-Lab/AI-Software-AlertaLab](https://github.com/Alerta-Lab/AI-Software-AlertaLab)  
**Entorno:** `https://wizard-ai-api.com`  
**Endpoint:** `POST /api/public/kaiman/chat`  
**Prioridad propuesta:** alta para el chat público de la landing

## Problema

Al hacer preguntas generales sobre Kaiman y después preguntas más específicas en la misma conversación, algunos seguimientos se interpretan como si trataran otra función. El `session_id` se conservó en todos los seguimientos de esta prueba, pero eso no garantizó una respuesta relacionada con el tema anterior. No se ha determinado la causa.

## Ejemplo 1: videos e imágenes

Solicitudes sin JWT ni API key, con `Content-Type: application/json`:

1. `{ "message": "¿Puedo crear videos en Kaiman?", "locale": "es" }` → HTTP 200. Respondió que sí y devolvió `session_id`.
2. `{ "message": "¿Puedo hacerlos a partir de una imagen?", "locale": "es", "session_id": "<SESSION_A>" }` → HTTP 200 con el mismo ID. En vez de responder sobre crear videos a partir de una imagen, dio instrucciones para editar imágenes o crear imágenes desde texto.
3. `{ "message": "¿Y agregarles narración?", "locale": "es", "session_id": "<SESSION_A>" }` → HTTP 200 con el mismo ID. Habló de narración para informes y presentaciones y de añadir narración a una imagen.

`<SESSION_A>` representa el identificador real devuelto en el primer turno, no un valor literal.

## Ejemplo 2: anuncios

En otra sesión, después de preguntar qué se puede hacer con Kaiman, si se pueden crear anuncios publicitarios y si hace falta subir una imagen, el seguimiento «¿Y puedo publicarlos directamente desde ahí?» devolvió HTTP 200 con el mismo `session_id`, pero respondió que no podía confirmar si se pueden publicar **sitios** directamente. El tema previo eran anuncios.

## Resultado esperado

Los seguimientos deben interpretarse usando el tema de la conversación. Si no hay suficiente información para resolver la referencia, el asistente debe pedir una aclaración. La respuesta debe estar limitada a funciones de Kaiman y apoyarse en información vigente, sin afirmar capacidades no verificadas.

## Otras observaciones del 6 de noviembre

- Las tres conversaciones sobre anuncios, videos e imágenes sumaron diez turnos HTTP 200; los siete seguimientos conservaron su identificador de sesión. Algunas respuestas de seguimiento fueron pertinentes; no se verificó cada afirmación funcional contra el catálogo del producto.
- Una pregunta de cultura general fue rechazada y el asistente ofreció información sobre Kaiman.
- Al pedirle generar y publicar una imagen indicó que no puede hacerlo desde el chat; no se verificaron efectos internos.
- Un mensaje vacío devolvió HTTP 400 con `message is required.`
- **Planes incorrectos:** al preguntar por planes, el chat mencionó Basic, Medium y Premium y no confirmó precios. Según la información proporcionada por producto, los planes esperados son **Starter, Pro y Business**. Actualizar la fuente de conocimiento del chat y contrastar precios, créditos y demás detalles contra el catálogo vigente de Kaiman. En el código local de esta landing figuran los identificadores `start`, `pro` y `scale`, por lo que también debe revisarse esa diferencia por separado.
- `sources` contiene identificadores internos, no enlaces públicos.

## Criterios de aceptación propuestos

1. Una conversación de prueba sobre videos interpreta los seguimientos como preguntas sobre videos o pide aclaración cuando corresponda.
2. Una conversación sobre anuncios conserva ese tema en preguntas de seguimiento o solicita una aclaración.
3. Dos sesiones distintas permanecen aisladas y se documentan duración y límites de contexto.
4. Al preguntar por planes, el chat usa Starter, Pro y Business, sujetos a confirmación contra el catálogo vigente, y no presenta Basic, Medium y Premium como planes actuales. Los precios, créditos y demás condiciones deben provenir de una fuente vigente del producto.

5. Se define cómo exponer las fuentes a visitantes.

No se probaron `429`, clave inválida, carga, aislamiento de sesiones ni persistencia tras recargar. No se conoce la causa del fallo ni se verificó el identificador del despliegue activo.

