# Resultado de la inspección del Word de prueba

Fecha: 3 de noviembre de 2026. Inspección local sin llamadas a IA ni gasto de créditos, con `mammoth` sobre `kaimanstudio_Weekly_Blog_2026-10-26.docx`.

## Resultado de la inspección inicial

- Detectados 5 temas y 10 versiones: una en español y otra en inglés para cada tema.
- Las 10 versiones contienen slug propio, alt de portada, alt y prompt de imagen interior y sección FAQ, según las etiquetas del documento.
- En la comprobación inicial, los 10 títulos SEO superaban 60 caracteres y 9 descripciones superaban 160. Esos umbrales no son límites de Google; se han retirado las advertencias y el título y la descripción SEO se conservan completos.
- La conversión HTML de Mammoth identifica 10 listas; la extracción como texto plano pierde el formato de viñetas.
- No se detectaron enlaces en el HTML extraído. La conversión HTML advirtió que no reconoció el estilo de párrafo `Title` del título general del documento.

## Cómo se resolvió en el importador

El importador ya está implementado (`src/features/posts/word-import.ts`, vista previa en `/admin/importar`):

- La lectura usa la conversión a Markdown de Mammoth en lugar del texto plano, de modo que las listas se conservan como listas Markdown.
- El contenido anterior a la primera etiqueta de idioma (`ENGLISH VERSION` / `SPANISH VERSION`) se ignora, por lo que el título general del documento no se confunde con el título de un artículo.
- Los prompts de imagen se guardan como datos editoriales y no aparecen en el Markdown público; la posición de la imagen interior se marca con `[IMAGEN_INTERIOR]`.
- El contenido sin etiqueta reconocida no se descarta en silencio: genera un aviso para revisarlo.

La prueba de integración `src/features/posts/word-real.integration.test.ts` comprueba con este documento que se obtienen 5 temas con versión en español y en inglés, que cada tema es válido para guardarse y que los prompts no quedan en el cuerpo. Solo se ejecuta cuando se indica la ruta del archivo en `TEST_WORD_PATH`; sin ella aparece como omitida.

## Límites

Estas pruebas no validan campo por campo todo el contenido frente al original ni otros formatos de Word. La traducción, la generación real de imágenes desde el panel y la publicación se cubren en [estado-proyecto-blog-chat.md](estado-proyecto-blog-chat.md), donde también figuran los pendientes.
