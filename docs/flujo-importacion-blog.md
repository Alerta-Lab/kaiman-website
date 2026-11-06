# Flujo propuesto de importación del blog

El panel incluye vista previa de Word, guardado de cada tema como borradores vinculados, traducción opcional, aceptación antes de generar imágenes y almacenamiento en Vercel Blob público. La prueba integral de generación de nuevas imágenes, controles privados para borradores y algunos campos editoriales adicionales siguen pendientes.

## Importación y revisión

1. Subir un Word y detectar temas y versiones de idioma. La vista previa permite guardar cada tema por separado.
2. Extraer y mapear contenido por tema e idioma. La IA identifica las versiones y sus campos con solicitudes de texto; el contenido se copia de los bloques extraídos del Word. El análisis consume créditos, y el número de solicitudes aumenta con las versiones. Hay que comparar el resultado con el original y revisar los bloques omitidos: no se garantiza una detección perfecta de todos los formatos.
3. Revisar y editar los campos en la vista previa. El servidor valida los datos y evita sobrescribir slugs existentes; no genera automáticamente sugerencias para corregir conflictos. Se guardan borradores, nunca se publica automáticamente.
4. Si solo existe español, ofrecer «Crear versión en inglés»; ejecutar la traducción únicamente cuando el usuario la solicite. Si solo existe inglés, ofrecer español del mismo modo. Si existen ambas versiones, conservarlas y vincularlas sin mostrar la oferta de traducción ni llamar a IA para traducir.
5. El usuario revisa y acepta cada borrador individualmente. La aceptación indica que el texto está listo para el paso visual: no cambia el estado a publicado.
6. Después de aceptar el contenido, se pueden generar portada e imagen interior de ese tema. La generación no se repite automáticamente y las imágenes requieren revisión antes de publicar.

## Mapeo del documento

| Etiqueta o información del Word | Destino previsto | Estado actual |
| --- | --- | --- |
| TOPIC | Grupo editorial de un artículo y sus versiones; no se publica como título | Detección y guardado por tema implementados |
| Versiones en inglés y español | Idioma y asociación entre versiones del mismo tema | La IA identifica las versiones; revisar que cada texto corresponda al idioma indicado |
| TITLE | Título visible, por idioma | Campo existente |
| SLUG | Ruta propia por idioma; validar unicidad | Importado, editable y con unicidad en la base de datos |
| META TITLE | Título SEO, por idioma | Campo existente |
| META DESCRIPTION | Descripción SEO, por idioma | Campo existente |
| LEDE | Resumen o entradilla, por idioma | Campo existente |
| HERO ALT TEXT | Descripción alternativa de portada, por idioma | Campo existente |
| HERO CAPTION | Pie de portada, por idioma | Guardado y mostrado con la imagen |
| HERO IMAGE PROMPT, si existe | Instrucción editorial privada de portada | Guardado; si falta se usan título, contexto y alt en la instrucción de generación |
| KEY TAKEAWAY | Bloque destacado del artículo | Convertido a cita Markdown; revisar presentación |
| INTRODUCTION | Párrafos iniciales | Convertido a Markdown |
| SECTION n, párrafos y listas | Encabezados, párrafos y listas del cuerpo | Convertido a Markdown para el formato reconocido |
| PULL QUOTE | Cita destacada | Convertida a cita Markdown |
| IN-ARTICLE IMAGE PROMPT | Instrucción editorial privada de imagen interior | Guardado fuera del Markdown público |
| IN-ARTICLE IMAGE ALT TEXT / CAPTION | Texto alternativo y pie de imagen interior, por idioma | Guardados como datos editoriales |
| FAQ con preguntas y respuestas | Sección visible del artículo | Convertida a Markdown; revisar formato |
| CLOSING CTA — HOOK LINE / HEADLINE | Texto final editable | Convertido a texto Markdown; botón y URL específicos no se generan automáticamente |
| Categoría y palabras clave (el Word no las trae) | Categoría = sector del negocio, una por artículo y compartida entre idiomas; palabras clave = temas | La IA las sugiere en la vista previa para revisión y edición en ambos idiomas; al guardar se aplica lo revisado. Si la sugerencia falla se puede guardar sin clasificación y completarla en el editor. |
| Autor, fuentes y relacionados | Campos editoriales opcionales; nunca inventar fuentes | Requiere trabajo o modelo específico |
| Fechas, canonical, Open Graph, datos estructurados y sitemap | Señales automáticas a partir del artículo publicado | Parciales; revisar y completar |

## Validaciones y protección del contenido

- Cada versión se guarda como borrador con su propio slug; se vinculan mediante un grupo de traducción.
- El título visible actualmente admite hasta 120 caracteres; si se supera debe avisarse sin recortar el original. El título SEO y la descripción SEO se conservan completos: Google puede mostrar solo una parte en los resultados, pero 60 y 160 caracteres no son límites de Google.
- Si un slug ya existe para el mismo idioma, el guardado falla sin reemplazar el artículo. El mensaje actual es general; se puede corregir el slug en la vista previa y volver a intentar.
- Las versiones incompletas o de idioma dudoso requieren revisión; no asumir que son una traducción equivalente.
- Las señales `hreflang` de artículos solo enlazan versiones equivalentes publicadas; falta mapear redirecciones de URLs anteriores antes de una migración.
- Las afirmaciones comerciales, datos y fuentes deben revisarse; una salida de IA no es evidencia de que sean correctos.

## Imágenes

- Portada horizontal 16:9; interior vertical 9:16 por defecto, con 3:2 como opción. La generación puede necesitar resolución compatible y recorte o adaptación revisable.
- La instrucción de generación incluye el título, el alt y el prompt del documento si existe, además de una dirección visual común. No se propone un prompt adicional editable automáticamente ni se detectan contradicciones. Se pide evitar letras y texto en la imagen; el resultado debe revisarse.
- Compartir las imágenes entre idiomas si son apropiadas para ambos; mantener sus descripciones alternativas y pies localizados.
- Las nuevas imágenes se almacenan en un Blob público persistente: cualquiera con la URL puede verlas, incluso antes de publicar. Las imágenes locales previas se pueden subir sin regenerar. Si se requiere confidencialidad para borradores, se debe implementar almacenamiento privado separado.

## Pruebas antes de usar créditos

1. Pruebas locales sin llamadas de pago: un tema con dos idiomas, solo español, solo inglés, múltiples temas, campos ausentes, límites superados, slug duplicado y extracción fiel de listas/FAQ.
2. Simular OpenAI y el almacenamiento para comprobar aceptación, ausencia de traducción si ya hay dos idiomas, selección de traducción y que no se generen imágenes antes de aceptar.
3. Ejecutar una prueba real acotada con un solo tema y dos imágenes, registrar tokens, costo estimado, tiempos y diferencias frente al Word. No publicar ni procesar los otros temas automáticamente.
4. Solo después de revisar resultados, repetir para el documento completo si se solicita.

La estimación de gasto es orientativa: extracción, traducción, reintentos y generaciones adicionales pueden cambiar el consumo. Mostrar alcance y costo estimado antes de las acciones de pago; el consumo real se toma de las respuestas de la API cuando esté disponible.
