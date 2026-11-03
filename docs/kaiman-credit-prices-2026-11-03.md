# Precios en créditos Kaiman por herramienta activa

**Fecha:** 2026-11-03
**Fuente:** `POST /api/pricing/calculate` del backend real (`wizard-ai-api.com`), cuenta LUMERA (cuenta 4).
**Alcance:** solo las herramientas visibles hoy en la UI. La lista sale de [`lib/active-feature-pricing.ts`](../lib/active-feature-pricing.ts) y de los otros componentes que cotizan (Topaz, HeyGen, Website, Análisis de video y Director).

Cotizar no crea jobs ni descuenta saldo. Se hicieron 263 consultas y todas respondieron `200`. Una clave inventada devuelve `404 pricing_feature_not_found`, así que cada `200` corresponde a una tarifa que existe.

Los precios de esta tabla son los que devuelve la API para **una pieza**. La UI multiplica por cantidad donde aplica (ver la columna "Cantidad").

---

## Imágenes

| Herramienta | Clave (`ad_images`) | 1K | 2K | 4K | Búsqueda web | Cantidad |
|---|---|---|---|---|---|---|
| Generar imagen | `image_generator` | 4 | 4 | 5 | +1 | 1 |
| Static Ad | `static_ad_creator` | 4 | 4 | 5 | +1 | × variaciones (1 a 3) |
| Logo | `logo_creator` | 4 | 4 | 5 | no aplica | × variaciones (1 a 6, default 3) |
| Papelería | `stationery_crafter` | 4 | 4 | 5 | no aplica | 1 |
| Template | `template_generator` | 4 | 4 | 5 | no aplica | × plantillas (1 a 6, default 3) |
| Quick Edits | `image_edit` | 4 | 4 | 5 | no aplica | 1 |

**Ejemplo:** un Logo con 3 variaciones en 2K cuesta 12 créditos.

### Estudio de imagen

| Modo | Clave (`ad_images`) | 1K | 2K | 4K | Cantidad |
|---|---|---|---|---|---|
| Photoshoot de producto | `product_photoshoot_simulator` | 4 | 4 | 5 | × tomas |
| Try-on | `clothing_accessory_try_on` | 4 | 4 | 5 | 1 |
| Personaje consistente | `consistent_character_generator` | 4 | 4 | 5 | 1 |
| Fusión | `multi_image_fusion` | 4 | 4 | 5 | 1 |
| Refinar | `image_refinement_multi_turn` | 4 | 4 | 5 | 1 |
| Magic eraser | `image_magic_eraser` | 4 | 4 | 5 | 1 |

### Mejoras de imagen (Topaz)

| Herramienta | Clave (`creative_suite`) | Créditos |
|---|---|---|
| Enhance (también Transparency) | `enhance` | 4 |
| Sharpen | `sharpen` | 4 |
| Denoise | `denoise` | 4 |
| Lighting | `lightning` | 4 |
| Restore | `restore` | 4 |

> `config/topaz.config.ts` todavía dice 1 crédito por operación. La API cotiza 4 y la UI ya muestra lo que dice la API.

### Multiformat Pack

Clave `analysis / multiformat_pack`. El precio depende de cuántos formatos visuales se piden (la cabecera de email cuenta como un formato más).

| Formatos | 1K | 2K | 4K |
|---|---|---|---|
| 1 | 6 | 6 | 7 |
| 2 | 10* | 10 | 12* |
| 3 | 14 | 14 | 17 |
| 4 | 18 | 18 | 22 |

Regla: 2 de base + 4 por formato en 1K/2K, o + 5 por formato en 4K.
`autoHeavy` (incluir video) suma **52**: 1 formato en 2K pasa a 58 y 3 formatos a 66.

\* Calculado por la regla, no consultado.

---

## Video

### Generación

Todas cobran igual en 360p y 720p. Duraciones disponibles en la UI: 4, 6, 8 y 10 s.

| Herramienta | Clave (`video`) | 4 s | 6 s | 8 s | 10 s |
|---|---|---|---|---|---|
| Texto a video | `text_to_video` | 13 | 19 | 25 | 31 |
| Imagen a video | `image_to_video` | 13 | 19 | 25 | 31 |
| Primer y último frame | `first_last_frame_control` | 13 | 19 | 25 | 31 |
| Video con referencias | `multi_reference_scene_builder` | 13 | 19 | 25 | 31 |
| Video narrado | `narrated_stock` | 13 | 19 | 25 | 31 |
| Video de producto | `product_demo_auto` | 13 | 19 | 25 | 31 |
| Video publicitario | `ad_to_video_instant` | 20 | 26 | 32 | 38 |

Regla: 1 + 3 por segundo. El video publicitario suma 7 más.
La API también cotiza 1080p (texto a video 8 s: 38), pero la UI no ofrece esa resolución.

### Edición Omni

| Herramienta | Clave (`video`) | 4 s | 6 s | 8 s | 10 s |
|---|---|---|---|---|---|
| Editar | `omni_video_edit` | 13 | 20 | 26 | 32 |
| Extender (cobra los segundos añadidos) | `omni_video_extend` | 13 | 20 | 26 | 32 |
| Remix (cobra la duración del original) | `omni_video_remix` | 13 | 20 | 26 | 32 |

### Clips y LTX

| Herramienta | Clave (`video`) | Tarifa |
|---|---|---|
| Clips (Vizard) | `ai_clipping` | 3 por minuto iniciado (10 min = 30) |
| LTX Retake | `ltx_retake` | 3 por segundo iniciado |
| LTX Extend | `ltx_extend` | 3 por segundo iniciado |
| LTX HDR | `ltx_hdr` | 3 por segundo iniciado |
| LTX Reframe | `ltx_reframe` | 3 por segundo iniciado |

LTX cobra la parte que se procesa: en Retake el rango elegido, en Extend lo que se agrega, en HDR y Reframe el video completo. 2,5 s cuestan 9.

### Avatares y voces (HeyGen)

Solo lo que hoy está conectado en la UI:

| Dónde está | Herramienta | Clave (`video`) | Tarifa |
|---|---|---|---|
| Avatares, crear video, pestaña Texto + voz (5 a 60 s) | Video con avatar | `heygen_avatar_video` | 45 por bloque de 30 s iniciado |
| Avatares, crear video, pestaña Texto + voz, con un personaje | Personaje que habla | `heygen_image_to_video` | 40 por bloque de 30 s iniciado |
| Avatares, crear video, pestaña Mi propio audio (hasta 600 s) | Avatar o personaje con tu audio | `heygen_avatar_video` o `heygen_image_to_video` | Igual que arriba, más 1 por archivo subido (`heygen_asset_upload`): 1 con avatar, 2 con foto propia |
| Avatares, crear video, pestaña Cinematic (4 a 15 s) | Avatar cinemático | `heygen_cinematic_avatar` | 54 fijo en ese rango |
| Avatares, crear avatar | Crear avatar | `heygen_create_avatar` | 75 fijo |
| Avatares, crear voz | Diseñar voz desde texto | `heygen_voice_design` | 5 fijo |
| Editor de imagen, grupo Video | Video narrado desde una foto | `heygen_image_to_video` | 40 por bloque de 30 s iniciado |
| Editor de video | Traducir (modo rápido, 1 idioma) | `heygen_translation_speed` | 24 por minuto iniciado |
| Editor de video | Lipsync (modo rápido) | `heygen_lipsync_speed` | 17 por minuto iniciado |
| Editor de video | Quitar muletillas | `heygen_filler_word_removal` | 3 por minuto iniciado |
| Chat, modo video | AI Video Agent | `heygen_video_agent` | 60 fijo |

**Ejemplo:** un video con avatar de 45 s ocupa 2 bloques, son 90 créditos.

**Fuera de la tabla a propósito:**
- **Clonar voz** (`heygen_voice_clone`, 36): la opción existe en el código, pero solo aparece si el plan de la marca tiene cupo de clonación, y hoy viene desactivado. Si se habilita, cuesta 36.
- **Traducción precisa** (`heygen_translation_precision`, 35 por minuto por idioma): la API la cotiza, pero el editor siempre manda el modo rápido y no tiene selector. Tampoco permite elegir más de un idioma.
- **Video con avatar de foto** (`heygen_photo_avatar_video`): la API lo cotiza, pero ninguna pantalla lo usa.

---

## Audio

| Herramienta | Clave (`audio`) | Tarifa |
|---|---|---|
| Texto a voz | `text_to_speech` | 6 por minuto iniciado |
| Diálogo | `text_to_dialogue` | 6 por minuto iniciado |
| Aislar voz | `audio_isolation` | 8 por minuto iniciado |
| Cambiar voz | `voice_changer` | 8 por minuto iniciado |
| Música | `music` | 14 por minuto iniciado |
| Efectos de sonido | `sound_effects` | 2 fijo (no depende de la duración) |

**Ejemplo:** 61 s de texto a voz son 2 minutos iniciados, 12 créditos.

---

## Guiones

| Herramienta | Clave | Créditos |
|---|---|---|
| Guión de video | `scripting / ai_script_video_generator` | 1 |

---

## Análisis

La misma clave cobra distinto según lo que se analiza: con imagen (o PDF) el precio es fijo, con video se suman 2 créditos por cada minuto iniciado de cada video.

### Análisis de imagen

Disponibles en el editor de imagen (grupo Análisis) y en el chat, modo análisis, subiendo una imagen o un PDF.

| Herramienta | Clave (`analysis`) | Dónde está | Créditos |
|---|---|---|---|
| Brand consistency | `brand_consistency` | Editor de imagen y chat | 1 |
| Audience resonance | `audience_resonance` | Editor de imagen y chat | 1 |
| Creative performance | `creative_performance` | Editor de imagen y chat | 1 |
| Visual fatigue | `visual_fatigue` | Editor de imagen y chat | 1 |
| Fatiga publicitaria (ad fatigue coach) | `ad_fatigue_coach` | Editor de imagen y chat | 1 (solo imágenes, no acepta video) |
| Compliance | `compliance_checker` | Editor de imagen y chat | 1 |
| Competitor insights | `competitor_insights` | Chat | 1 |
| Valoración Kaiman | `kaiman_assessment` | Chat | 3 |

### Análisis de video

Disponibles en el editor de video (grupo Análisis) y en el chat subiendo un video. Videos MP4, MOV, WEBM o M4V de hasta 3 minutos y 200 MB, hasta 3 por análisis.

| Herramienta | Clave (`analysis`) | Dónde está | Hasta 1 min | 2 min | 3 min |
|---|---|---|---|---|---|
| Revisión creativa de video | `video_creative_review` | Editor de video | 4 | 6 | 8 |
| Brand consistency | `brand_consistency` | Editor de video y chat | 3 | 5 | 7 |
| Audience resonance | `audience_resonance` | Editor de video y chat | 3 | 5 | 7 |
| Creative performance | `creative_performance` | Editor de video y chat | 3 | 5 | 7 |
| Visual fatigue | `visual_fatigue` | Editor de video y chat | 3 | 5 | 7 |
| Compliance | `compliance_checker` | Editor de video y chat | 3 | 5 | 7 |
| Competitor insights | `competitor_insights` | Chat | 3 | 5 | 7 |
| Valoración Kaiman | `kaiman_assessment` | Chat | 5 | 7 | 9 |

Regla: precio base del análisis + 2 por minuto iniciado de cada video. Con varios videos se suma por cada uno: dos videos de 40 s en Brand consistency son 1 + 2 + 2 = 5. La revisión creativa no tiene versión de imagen: es 2 de base + 2 por minuto.

### Análisis de texto

No llevan imagen ni video, se completan con texto en el chat.

| Herramienta | Clave (`analysis`) | Créditos |
|---|---|---|
| Analizar reseñas (voice of customer) | `voice_of_customer` | 1 |
| Analizar publicación (performance loop) | `performance_loop` | 1 |
| Trend pulse | `trend_pulse` | 1 |

### Radar

Radar (análisis de competencia) no usa esta API de precios. Su costo lo estima el backend al armar el análisis, según los módulos, la profundidad y la cantidad de competidores elegidos, y se muestra antes de confirmar. No tiene una tarifa fija que se pueda listar aquí.

---

## Sitios web

| Tipo de sitio | Clave (`website`) | Créditos |
|---|---|---|
| Landing page | `landing_page` | 26 |
| Microsite | `microsite` | 29 |
| Portafolio | `portfolio` | 33 |
| Funnel de ventas | `sales_funnel` | 41 |
| Sitio de negocio | `business_website` | 48 |
| E-commerce | `ecommerce` | 64 |
| Dirección creativa (paso de recomendación) | `creative_direction` | 8 |
| Refinar experiencia | `refine_experience` | 14 |
| Regenerar página | `regenerate_page` | 10 |

---

## Presentaciones (Gamma)

| Herramienta | Clave (`presentations`) | Tarifa |
|---|---|---|
| Generar, sin imágenes o con imágenes web | `gamma_generate` | 9 por slide |
| Generar, con imágenes de IA | `gamma_generate` | 44 por slide |
| Desde plantilla | `gamma_from_template` | 9 |

> La API cotiza la **reserva inicial**. En jobs reales anteriores (4273 y 4277, 2 slides con IA) se reservaron 88 y el cobro final quedó en 15 al terminar. El monto definitivo de Gamma puede ser menor que esta cotización.
> Solo se probó el modelo `flux-1-quick` y la opción sin modelo. Otros modelos de imagen pueden cotizar distinto.

---

## Director (Copilot)

El Director no tiene tarifa propia: cotiza cada pieza con las mismas claves de arriba.

| Pieza del Director | Clave que usa |
|---|---|
| Imagen | `ad_images / image_generator` |
| Anuncio estático | `ad_images / static_ad_creator` |
| Video publicitario | `video / ad_to_video_instant` |
| Video narrado | `video / narrated_stock` |

Además, cada mensaje al Director descontó cerca de 1 crédito en las pruebas reales del 19 de octubre. Ese cobro por mensaje **no sale de esta API** y no está confirmado como tarifa oficial.

---

## Pendientes y diferencias encontradas

- **Topaz:** la API cotiza 4 créditos, `config/topaz.config.ts` dice 1. Conviene alinear el config o confirmar con backend cuál es el correcto.
- **Imagen 2K con búsqueda web:** la API cotiza 5, pero en pruebas del 7 de octubre el cobro real fue 4. No se volvió a verificar.
- **Gamma:** la cotización es la reserva, el cobro final se ajusta al terminar.
- **Director:** el cobro por mensaje no tiene cotización en la API.
