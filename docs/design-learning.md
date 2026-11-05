# Design learning log — landing-kaiman

Living notes. Append a dated entry whenever visual direction, tokens, layout, or copy conventions change while building.

## How to use

1. After a meaningful design or copy change, add a new entry at the top of **Entries**.
2. Record what changed, why, and any rule to keep applying next time.
3. Prefer facts over opinions. Link files when useful.

---

## Entries

### 2026-11-05 — GitHub Pages: redirect sin `base`

- Síntoma: `/kaiman-website/` redirigía a `/es/` (raíz del org) → 404; `/kaiman-website/es/` sí respondía 200.
- Causa: `Astro.redirect('/es/')` ignora `base: '/kaiman-website/'`.
- Fix: `localeUrl()` vía `getRelativeLocaleUrl` en `index` y redirects de locale/blog.
- Language switch: `pathWithoutLocale` no quitaba el base → URLs tipo `/en/kaiman-website/es/`. Ahora `stripBase` + `getRelativeLocaleUrl`.

### 2026-11-04 — Problem facets + secreto

- Facets con `Card`: imagen + footer label (Colores / Tipografías / Tono… / Estilo) + índice; sin «su/sus».
- Secreto: texto blanco más grande; acento `text-feature-image` en «consistencia de marca» / «brand consistency».

### 2026-11-04 — Wireframe NEW: copy + distribución

- Fuente: `docs/references/wireframe-home-en-new/Main.dc.html` (ES del HTML; EN traducido).
- Copy renovado en hero, origen, problem, Brand Understanding, audiencias, tools, value, playbooks, FAQ, close.
- Layout: problem con título+intro / 4 facets etiquetadas / caja “secreto”; sección `#menos`; 4 audiencias con pasos (`#ana` `#carlos` `#sofia` `#coaches`).
- Imágenes section-* y mock de prompt del hero se mantienen.

### 2026-11-04 — Rama wireframe landing (sin GSAP)

- Branch `feat/wireframe-landing`: `WireframeLanding.astro` replica la estructura de `docs/references/wireframe-home-en/Main.dc.html`.
- Tokens/proyecto: `Button`, ink/primary, imágenes de `public`, SiteHeader/Footer.
- Extra vs wireframe: demo video, PlanFinder (piezas al mes), blog real, FAQ/planes del diccionario landing.
- Copy narrativo en `src/i18n/locales/{es,en}/wireframe.ts` vía `getWireframe`.
- Tipografía: títulos con `leading-[1.02–1.1]` (antes default ~1.5), body más compacto, menos padding de sección.
- Ajustes: hero con más `pt` bajo header; problem en grid 2×2 (crops de `inconsistence`); Brand Knowledge con `inconsistence.png`; planes `md:grid-cols-3`; sección Playbooks; sin login en CTA final.
- Tools/Blitz: 8 cards del wireframe, grid `auto-fit minmax(16.25rem)`, media ~150px de alto + chips de categorías.
- Hero prompt: shell estilo Wizard (`border-2` feature-image `#db2777`, pills `black-capsule`); texto fijo + brand + formato seleccionado + 3 outputs.
- Hero modes: tamaño normal (`text-sm` + `px-3`), una línea (`flex-nowrap` + `overflow-hidden` + `shrink-0`); si no caben se cortan, sin wrap ni scroll.
- Assets wireframe por sección (PNG en `public/`): `section-2.png` (origen), `section-3.1`…`3.4.png` (problem), `section-4.png` (Brand Knowledge), `section-11-1`…`11-8.png` (tools blitz). Si falta el archivo, el path queda asignado.

### 2026-11-04 — Tour: media de pasos

- 01 `brand-profile.png`, 02 `single-item-order.png`, 03 `order-ready.png`.

### 2026-11-04 — Audiencias: foto en el encabezado

- Foto 1:1 a la izquierda del nombre + título del perfil; las cards de acción solo título + texto.
- Overview desktop: al pin de la sección, el scroll pasa el foco Martinez → Ana → Carlos → Sofia (foto + lista).
- Cursor pan (círculo + flechas ↔) restaurado sobre `[data-h-scroll]`; el wheel vertical sigue libre.

### 2026-11-04 — Producto: swap texto → imagen

- Stage 1 (Producto): el copy de la derecha cede a `inconsistence.png` (titular izquierda fijo).
- Stage 3 (Consistencia): el copy de la derecha cede a `consistency.png`.
- Ambas imágenes: `object-contain` + `max-h` acotada, centradas con padding (no full-bleed).
- Desktop: pin + scrub (`data-swap-col`). Mobile: texto e imagen apilados, sin swap.

### 2026-11-04 — Assets en GitHub Pages (slash de base)

- Fallo: `base: /kaiman-website` sin `/` final → `asset()` unía `kaiman-website` + `video/...` = 404.
- Fix: `base: /kaiman-website/` y `asset()` fuerza un `/` entre base y path.

### 2026-11-03 — 404 al estilo landing

- Fondo ink + radiales, header cápsula, logo Kaiman, display 404 atenuado, CTAs `k-btn` (ES / EN / Blog). Sin look lavanda del blog.

### 2026-11-03 — GitHub Pages

- Workflow `.github/workflows/deploy-github-pages.yml` (Astro static, no Jekyll).
- `pnpm build:pages` + `GITHUB_PAGES=true` → `base: /kaiman-website`, sin adapter Vercel; aparca `/api` y `/admin` durante el build.
- En Settings → Pages: Source = **GitHub Actions**.

### 2026-11-03 — Nav con entrada de cortinas

- Enlaces in-page (Sobre Kaiman, Planes, footer, rail): no ancla suave; barras negras cubren, saltan al destino y abren (misma entrada que el load).

### 2026-11-03 — Estimador de créditos (tarifas API)

- Fuente: `docs/kaiman-credit-prices-2026-11-03.md`. Un paso de slider = 1 unidad tarifada: imagen 4, clip video 8 s = 25, guion 1, audio 6/min, slide 9, landing 26. Copy assumption + FAQ ES/EN alineados.

### 2026-11-03 — Salsana modal + cursor expand

- Expand abre modal centrado en viewport (portal a `body`), no fullscreen nativo.
- Hover en expand: cursor custom pasa de hand a icono expand; círculo más pequeño en canvas (grab/expand).

### 2026-11-03 — Cursor sin pan en carruseles

- El círculo custom ya no aparece sobre `[data-h-scroll]` (modo pan). Wheel vertical tampoco se redirige al track: el scroll de página queda libre; el carrusel sigue por drag / gesto nativo.

### 2026-11-03 — Recorrido del producto (v2)

- Copy descriptiva ES/EN (sin placeholders). Pasos con media real (showcase, demo poster, pieza Salsana).
- &lt; lg: snap carousel; lg: 3 cols + rail 01—02—03. `#recorrido`.

### 2026-11-03 — Footer columnas mobile/tablet

- Contacto a ancho completo; Producto / Recursos / Legal en 2 cols (móvil) y 3 cols (tablet); 4 cols en lg. Copyright fuera de Legal, fila propia.

### 2026-11-03 — Carruseles mobile

- &lt; lg: snap carousel (`data-h-scroll`) en detalles de marca, Brand Understanding, audiencias (foto+título por slide), plataforma, planes, capacidad y playbooks.

### 2026-11-03 — Mobile simple (Monument)

- &lt; lg: stories sin pin/scrub (producto/plataforma/audiencias en flujo); timelines horizontales sin pin (scroll nativo).
- Desktop (≥1024) conserva pins GSAP.

### 2026-11-03 — Hero + header responsive

- Hero &lt; lg: telón izq. a ancho completo (sin franja de video); demo al scroll.
- Header &lt; lg: hamburguesa (mismo panel Sobre Kaiman); Sobre Kaiman + Planes solo desde lg.

### 2026-11-03 — Estimaciones de créditos

- Finder y rates: disclaimer visible de que el cálculo es aproximado y puede variar (ES/EN). Corporativo vuelve a card dark.

### 2026-11-03 — Planes Starter / Pro / Business / Enterprise

- Arriba 3 cards (Esencial/Profesional/Empresarial); abajo Corporativo a ancho completo con copy de ajuste a medida (ES/EN).
- Profesional: 1500 créditos + 3 marcas; badge «Más popular».

### 2026-11-03 — Footer link hover

- Links del footer: hover con underline (sin cambio de color).

### 2026-11-03 — Sección últimos blogs

- Tras Playbooks: `#blog` con 3 posts publicados (`listPublishedPosts`), cards dark + CTA al índice del blog; empty state i18n.

### 2026-11-03 — Capacidad timeline horizontal

- `#capacidad` usa el mismo patrón que Playbooks: pin + carrusel scrub + línea de progreso (`initHorizontalTimeline` compartido).

### 2026-11-03 — Playbooks timeline pin order

- Playbooks ST se crea después de los story pins; `anticipatePin: 0`; progreso = `maxShift` real; pin/plataforma con `bg-ink-100` para no traslapar.

### 2026-11-03 — Playbooks timeline + header border

- FAQ accordion ~0.32s.
- Header bar: `border border-black-stroke` (#404040).
- `#playbooks`: pin + carrusel horizontal scrub; línea de progreso; cards numeradas tipo timeline.

### 2026-11-03 — FAQ cierra en toda la card

- Con `details` abierto, un click en el cuerpo de la respuesta también cierra (no solo el `summary`).

### 2026-11-03 — CTA final 2 columnas

- Cierre: copy + CTAs izq. (primario signup, secundario wearealerta.com); der. placeholder de imagen (`final.imageAlt` ES/EN) listo para asset.

### 2026-11-03 — Chapter rail sync

- Rail incluye `plataforma` y etiquetas reales (Producto, Brand Understanding, etc.).
- Hero/demo/origen siguen el scrub del curtain; el resto usa un probe de scroll (`top ≤ 42vh`) para no perder `producto` ni apagar el indicador en secciones con pin/sticky.

### 2026-11-03 — Recorrido del producto

- Título + texto arriba; hairline `border-white/15`; debajo las 3 cards de slots (sin cambiar copy ni placeholders).

### 2026-11-03 — Plataforma vuelve a 2 columnas

- Se revirtió el carrusel centrado. `#plataforma` otra vez como `data-story`: título fijo izq. + stages der. (intro → 01…05) con fill de título y `data-stage-line`.

### 2026-11-03 — Gutter unificado desde plataforma

- Desde `#plataforma` hasta el CTA final: sin `Container`/`max-w-content`; solo gutter Monument (`px-5 sm:px-8 lg:px-10`) como las secciones superiores. Copy puede seguir en `max-w-copy`.

### 2026-11-03 — Salsana canvas masonry

- «Misma marca, varias piezas»: 2 cols (título izq. / canvas der.); sección `h-svh max-h-svh`; canvas `h-full` sin forzar alto extra.
- Cursor canvas: mano (`grab`) / mano cerrada al drag (`grabbing`).

### 2026-11-03 — Brand timeline gallery panel

- Paso 03: collage sin crop — izq. 2×16:9, der. 9:16; columnas `flex-[128]/[81]`; Martinez WebP vertical.
- Cerrar menú: `cursor-pointer`.

### 2026-11-03 — FAQ dos columnas (miligram)

- `#preguntas`: título + lead sticky izq.; acordeón der. con hairlines y `+` a la izquierda (sin cards).
- Hairline vertical en la columna de preguntas (`lg:border-l`), no en el aside.
- Una sola `details` abierta; activa `bg-white` + texto ink; altura animada GSAP (~0.55s); textos `select-none`.
- Mismo gutter/grid Monument (`1fr / 1.05fr`); lead ES/EN en `faq.lead`.

### 2026-11-03 — Gutter full-bleed Monument

- Columna compartida: `px-5 sm:px-8 lg:px-10` (sin `max-w-content`) en Brand Understanding, audiencias y perfiles, alineada al grid de producto/consistencia.
- Grid 2 cols `1fr / 1.05fr` + hairline vertical en Brand Understanding.

### 2026-11-03 — Brand Understanding sticky stack (miligram)

- Sección sin pin GSAP: columna izq. sticky (eyebrow + título + copy) y paneles der. `lg:sticky top-0` con `bg-ink-100` y z-index creciente para que el siguiente se pegue y empuje/cubra al anterior.
- Tags «Kaiman entiende» como pills outline en el primer panel; títulos de paso en `font-display` italic.

### 2026-11-03 — Leads de audiencia en primary

- Perfiles (Martinez/Ana/Carlos/Sofia): `lead` como headline (`font-display`) en `text-primary`.

### 2026-11-03 — Imágenes consistencia optimizadas

- `colors/typography/comunication/visual.png` (~1.4MB c/u) → `public/brand/point-*.webp` (~10–26KB), ancho máx. 1200.
- PNG pesados eliminados; cards usan `<img>` con esas rutas.

### 2026-11-03 — Producto/consistencia diagram Monument

- Timeline consistencia: 3 stages a full-bleed grid (título|copy; barra de 4 atributos; secreto|cierre).
- Points como franja inferior tipo logo bar (hairlines + 16:9 + label).

### 2026-11-03 — Origen seleccionable + lead primary

- Tras el fill, se oculta la máscara y `data-solid=true` (pointer-events + colores finales) para poder seleccionar texto.
- Lead «Durante años…» en `text-primary-300`.

### 2026-11-03 — Origen layout Monument + cursor go

- Origen: grid 2 cols tipo Monument (título grande izq., lead + cuerpo der., hairlines); mantiene text-fill unido.
- Cursor `go`: sin `invert`; `bg-white text-ink` para contrastar sobre primary.

### 2026-11-03 — Botones estilo Webdrift

- `Button.astro`: wipe vertical (`::before` scaleY), text roll (doble span) e icono flecha en primary md.
- CSS en `global.css` (`.k-btn*`) — excepción documentada: hover/pseudo no caben limpios en utilities.
- Primary: violeta → fill blanco. Secondary: outline → fill primary.

### 2026-11-03 — Logo wordmark en header

- Header usa `/kaiman-logo.png` (marca + texto); se quita el span «Kaiman» al lado.

### 2026-11-03 — Header oculto en demo video

- Durante el scroll del video demo del hero (`progress` ~0.3–0.68) el header pasa a `opacity: 0` + sin pointer-events; al salir vuelve a 100%.

### 2026-11-03 — Back-to-top circular dock

- Botón circular solo flecha, `fixed` abajo-derecha; al entrar al footer hace FLIP al dock junto al CTA.

### 2026-11-03 — Footer sin logo grande

- Se quita `kaiman-logo-footer.png`; arriba queda solo «Kaiman Studio» pequeño (`copy.footer.studio`).

### 2026-11-03 — Hero CTAs sin hover fantasma

- Salida del hero usa `autoAlpha` (no solo `opacity`) para que register/CTA no reciban hover en la esquina tras el telón.

### 2026-11-03 — Cursor video crece al hover

- Círculo parte en `scale: 0.38` y crece a `1` al entrar al hotspot; al salir vuelve a compacto.

### 2026-11-03 — Cursor video se oculta al scroll

- Custom cursor: en `scroll`/`resize` revalida con `elementFromPoint` (rAF); si el pointer ya no está sobre hotspot/go/pan, se oculta. `pointerleave` no basta con pin/scrub.

### 2026-11-03 — Hero responsive sin corte de texto

- Mobile: panel izquierdo rectangular `w-[78%]` (sin diagonal) para que el copy no se coma el clip.
- sm+: diagonal suave + `pr` interno; hotspot alineado al borde del video.
- Título escalado `text-3xl → lg:text-6xl`; copy `max-w-[34rem]`.

### 2026-11-03 — Click video hero sin delay

- `scrollToDemo`: 0.5s + `power3.out`, `autoKill: false` (el pin/scrub mataba el tween).
- `onUpdate` fuerza `getTween().progress(1)` para saltar el lag del scrub.
- Telón: mantener `z-[12]` / `z-[14]` (arbitrarios); `z-12`/`z-14` no son la escala por defecto.

### 2026-11-03 — Cursor video Play/Pausa

- Hover del video (sección 2): `Play` / `Pausa` (es) y `Play` / `Pause` (en); ya no «Ver video».

### 2026-11-02 — Perfiles audiencia layout Monument

- Ana/Sofía/Carlos: título arriba; abajo dos columnas (texto | scroll horizontal).
- Sin `data-story` pin por perfil; el h-scroll se reutiliza en la columna derecha.

### 2026-11-02 — Cards menores, fill solo origen, Brand steps

- Cards consistencia más compactas (`max-w-2xl`, tipografía y padding menores).
- Text-fill solo en origen (sección 3); fuera de Brand y perfiles Ana/Sofía/Carlos.
- Steps de Brand: layout fijo número + línea + borde, sin columnas alternadas que se veían rotas.

### 2026-11-02 — Origen menor, cards marca, Brand story, footer grande, header

- Origen: tipografía un escalón más pequeña.
- Consistencia: cards con slot 16:9 arriba + label sin «su/sus» (Colores, Tipografías…).
- Brand Understanding: `data-story` con intro + steps, número grande y layout alternado.
- Footer: sección a altura de viewport con lead, CTA y columnas.
- Header: «Sobre Kaiman» a la izquierda (abre menú), Planes a la derecha; menú con expansión `clip-path: circle`.

### 2026-11-02 — Text fill unido arriba→abajo

- Origen: un solo `data-text-fill-mask` sobre todo el bloque; `clip-path: inset(0 0 X% 0)` para rellenar de arriba hacia abajo.
- Títulos de story con la misma dirección (antes el inset superior cortaba a media palabra).

### 2026-11-02 — Personas timeline, origen fill, menú click

- Perfiles de audiencia pasan a `data-story` (copy → cards). Títulos con fill Webdrift (`data-text-fill-mask`).
- Origen: fondo negro, tipografía grande blanca; el texto se llena al scrollear (clip inset).
- Menú fullscreen al click (números 01…, tipografía grande), desktop y mobile.
- Estimador: video también en minutos; label `minutos`/`minutes` a la derecha.
- Drag h-scroll nativo en el track (pointer capture) para mouse y touch.

### 2026-11-02 — Timelines, Enterprise, finder, overflow

- Crossfade de stages más largo (opacidad dominante, menos desplazamiento Y).
- Enterprise vuelve a la sección Planes, encima de las tres tarjetas.
- Estimador: audio (minutos, 2 cr/min), presentación (5 cr) y website (15 cr).
- `overflow-x-clip` en html/body/main para cortar scroll horizontal sin romper pins.
- Drag del carrusel horizontal con el mismo `quickTo` que la rueda.

### 2026-11-02 — Timelines fuera del shape wipe

- `[data-story]` y `[data-brand-timeline]` no llevan clip-path ni `overflow-hidden` forzado: el pin/scrub y el sticky del Brand se rompían.
- Brand timeline usa clases propias sin `overflow-hidden` del `panel`.
- `main` sin `overflow-x-hidden` (computaba `overflow-y: auto` y obligaba a pin por `transform`, desincronizando el scrub). Sticky del Brand con `sticky top-28`.

### 2026-11-02 — Clip-path tipo carta (Monument)

- Sin capa de color: solo la sección. El clip parte de un rectángulo irregular inset y se abre hacia afuera hasta el frame completo (sensación de carta), no una banda inferior que deja hueco.
- `main#contenido` en `bg-ink-100` para que el margen del clip no deje ver el radial morado del `body`.
- Stories cierran el clip antes del pin; `initShapeWipes` va después de los pins + `ScrollTrigger.refresh()`.

### 2026-11-02 — Clip-path visible con fondos iguales

- Con todas las secciones en `#181818` el borde del clip no se leía. Cada wipe inyecta una capa de color (`data-shape-surface`) que abre en banda diagonal y luego se disuelve al ink.
- Stories vuelven al wipe, pero cierran el clip antes del pin para que Brand / Audiencias no queden recortados.
- `initShapeWipes` corre después de los pins + `ScrollTrigger.refresh()`; si no, start/end quedan desfasados y el clip no avanza.

### 2026-11-02 — Fondos ink-100 + Brand visible

- Secciones de contenido en `bg-ink-100` (#181818) para leer el clip-path de entrada.
- Shape wipe no aplica a `[data-story]` (producto/audiencias); evita que Brand quede recortado por el pin.

### 2026-11-02 — Quicksand semibold + wipe SVG

- Quicksand body a `font-semibold` / token `body: 600` (landing + blog Text).
- Transición: la propia sección abre con `clip-path` (banda diagonal → full). Sin overlay fijo.

### 2026-11-02 — Scroll libre sin snap

- Quitamos snap del hero/story y el settle por sección. El scroll queda continuo (referencia stillform.homes); el scrub sigue ligado al movimiento.

### 2026-11-02 — Fotos audiencia + carrusel horizontal

- Fotos `/martinez.png`, `/ana.png`, `/carlos.png`, `/sofia.png` en switcher y perfiles.
- Perfiles: columna copy + track horizontal de cards; rueda y drag; cursor circular con icono de scroll.
- Telón de color por perfil (`data-profile-curtain`) que se abre en diagonal al entrar.

### 2026-11-02 — Origen único + audiencias story

- Una sola copia de «El poder del marketing…» en el telón (`data-origen-layer`); `#origen` queda como ancla.
- Audiencias: story de 2 etapas (intro → fotos/nombres) con el mismo scrub vertical que marca.

### 2026-11-02 — Menú, cursores, origen primary, audiencias

- Planes sale del menú Sobre Kaiman; permanece en footer.
- Cursor: «Ver video» / «Watch video» en hotspot; «Ir» / «Go» en `[data-cursor-go]` (botones y lista de audiencias).
- Telón 2→3: capa primary cierra sobre el video; sección `#origen` en `bg-primary` con texto negro.
- Brand Understanding: layout sticky + timeline vertical 01–03.
- Audiencias: foto placeholder izquierda + lista de nombres a la derecha (hover cambia foto, click ancla).

### 2026-11-02 — Story marca: solo vertical

- Las 3 etapas de producto (`data-story-stage`): la anterior sube y sale; la nueva entra desde abajo. Sin desplazamiento en X (nada diagonal).

### 2026-11-02 — Snap anti “colgado”

- Hero telón: snap binario cerrado/abierto (nunca a media abertura).
- Story marca: segmentos iguales + `snapTo: 1/(stages-1)` y fades cortos para asentar cada etapa completa.
- Settle auxiliar al soltar scroll entre paneles libres (no compite con pins activos).

### 2026-11-02 — Hero único + snap + motion plain/styled

- Quitamos la sección demo duplicada; un solo video en el hero. `#demo` es ancla; snap del telón a cerrado/abierto.
- Copy hero: eyebrow+título salen arriba; resto a la izquierda. Cortina derecha `bg-black/55`; corte izquierdo más abierto.
- Hotspot: Play hace scroll al video abierto; en abierto, Play/Pause.
- `data-motion="plain"` en origen/brand/audiencias; `styled` (lados) desde perfiles de audiencia hacia abajo.

### 2026-11-02 — Hero telón Monument + hotspot

- Hero pin + scrub: cortinas left/right/top/bottom abren la abertura del video (slit → trapecio → full).
- Copy y wordmark salen de pantalla al scrollear; click en el hotspot del video hace `scrollTo` a `#demo`.
- Cursor Play solo sobre el hotspot del video en hero (no pausa ahí). En `#demo`, Play/Pause controla el loop.
- Referencia: monument.tv frames de abertura diagonal / trapecio.

### 2026-11-02 — Video peek + magnetic cursor + lateral reveals

- Hero: video en máscara angular a la derecha (formas geométricas); demo full-bleed loop muted sin controles.
- Cursor magnético circular (Play/Pause) en zonas `data-video-zone` (hero + demo), referencia monument.tv.
- Revelados de sección con `data-reveal` left/right/up; story stages también entran de lados.
- Fondos: quitamos radiales densos; degradados laterales sutiles con `primary` y `feature.*` del `tailwind.config`.

### 2026-11-02 — Scroll chapters + demo

- Dropdown Sobre Kaiman: puente `pt-2` para no cerrar al mover el cursor; ancho `min-w-[28rem]`.
- Nueva sección Demo (bloque primary temporal + CTA) con modal del video `demo-*.mp4`.
- Origen centrado. Producto pasa a story scrub (etapas sticky, sin corte duro).
- Rail de capítulos tipo 1st December a la derecha. Referencias: 1stdecember, monument.tv, stillform.homes.
- Quitamos pin universal; reveals suaves + `scroll-smooth`.

### 2026-11-02 — Header con Menú dropdown

- Desktop: Logo + Menú (hover/focus-within, grid 2 columnas) + Blog; derecha idioma / Entrar / CTA.
- Menú agrupa Cómo funciona, Brand Understanding, Planes, Playbooks y FAQ. Blog queda fuera.
- i18n `nav.menu` (ES/EN). Panel con Tailwind `group-hover` / `group-focus-within`, sin `<style>`.

### 2026-11-02 — Hero scroll copy visible (live accept)

- Bug: `scrub-engine` sobreescribía `translateY(-50%)` y el bloque quedaba a media pantalla.
- Fix: desktop usa `translateY(calc(-50% + parallax))`; móvil mantiene ancla inferior.
- Variante compacta aceptada: tipografía y gaps más densos, `max-height: 100dvh - 7.5rem`.

### 2026-11-02 — Claridad visual landing (steer)

- Bandas alternas `ink` / `ink-100` y borde superior suave para separar secciones del PDF.
- Cuerpo en `neutral-200` (mejor contraste). Paneles planos sin hover-lift en contenido de lectura.
- Audiencias: índice con borde + anclas `scroll-mt-28`. Plan Medium (`pro`) resaltado con ring primary. FAQ con + rotatorio. Cierre en lavanda `primary-900/25`.

### 2026-11-02 — Copy Nuevo Site Kaiman

- Textos de landing tomados del PDF “Nuevo Site Kaiman” (ES) y traducidos a EN.
- Secciones nuevas: origen, consistencia, Brand Understanding, audiencias (4 perfiles), plataforma, eficiencia, Playbooks.
- Planes renombrados en copy a Basic / Medium / Premium; precios y cupos siguen el catálogo público.
- Nav y footer alineados a Producto / Cómo funciona / Brand Understanding / Planes / Playbooks / FAQ.

### 2026-11-02 — Footer del blog

- `PublicFooter` replica contacto, privacidad, términos, Alerta e Instagram de la landing, con superficie Quiet Signal. Va en índice, artículo, búsqueda y categoría.

### 2026-11-02 — Toast de errores en admin

- Toast en `components/blog/molecules/Toast.tsx`: mensaje amigable + “Mostrar más” con el detalle técnico.
- La API de posts traduce Zod a texto legible (`Contenido Markdown: escribe al menos 20 caracteres`) y envía `detail` con el JSON original.

### 2026-11-02 — 404 Quiet Signal

- La 404 pasa del fondo ink a lavanda Quiet Signal, con marca Kaiman, cifra 404 en violeta y tres salidas: inicio ES, inicio EN y blog.
- Tipografía Space Grotesk / Quicksand, iconos Lucide, foco visible y `noindex`.

### 2026-10-27 — Contraste y salida del scroll

- El vuelo deja la pantalla al terminar: el texto, el video y los puntos se ocultan antes de que entre la sección siguiente.
- El texto del vuelo va sobre un velo negro. El botón es violeta con texto blanco. La etiqueta del recorrido es texto oscuro sobre blanco.
- El motor ya no pinta el fondo de toda la página. El sitio sigue en negro.

### 2026-10-27 — Scroll world, type, gallery, plan handoff

- **Type**: títulos en Space Grotesk (`font-display`). Cuerpo en Quicksand (`font-sans`).
- **Scroll**: el hero usa el motor `scrub-engine.js` de scroll-world. El video de demo se reencodificó con keyframes cada 8 frames (`public/video/scrub-es.mp4` y `scrub-en.mp4`) para que el scroll mueva la cámara. No hay clips de conexión generados: las escenas 2 y 3 cruzan con fotos de Salsana.
- **Fondos**: degradados radiales en violeta, rosa y cian sobre negro, en la línea visual de Higgsfield con la paleta de Kaiman.
- **Galería**: masonry. Videos en loop y sin audio. Al pasar el cursor aparece Generar, que abre el registro. Arriba va el nombre de la herramienta. El icono de expandir abre un modal.
- **Plan**: sliders en lugar de steppers. Obtener plan abre el registro con `?plan=` y escribe la cookie `kaiman_plan`. Esa cookie solo se comparte si el sitio está en `*.kaimanstudio.ai` (`Domain=.kaimanstudio.ai`). En otro dominio el enlace con `plan` es lo que la app puede leer.
- **Idiomas**: una sola página de componentes. `/es/` y `/en/` solo cambian el diccionario. El selector es un dropdown.
- **Iconos**: Lucide en navegación, planes y contacto. Instagram con `react-social-icons`.

### 2026-10-27 — Landing story, brand colors, media

- **Layout**: long form story. One action: crear cuenta en `app.kaimanstudio.ai`.
- **Color**: tokens copiados del `tailwind.config` de Wizard (`primary` #6B48E9, superficies oscuras `#000` `#181818` `#1F1F1F` `#272727` `#313131`, colores de pieza imagen/video/guion/audio/presentación).
- **Type**: Geist Sans, una sola familia, pesos hasta semibold.
- **Motion**: revelado al entrar en vista (32px, 700ms, curva 0.22,1,0.36,1). La frase central enciende palabra por palabra. Menú móvil a pantalla completa. Keyframe `menu-link-in` en `global.css` porque Tailwind no cubre la entrada escalonada.
- **Copy**: relato neutro. Kaiman guarda marca, público, tono, sector e historial de piezas. Sin calculadora de impacto. En su lugar, un estimador de piezas al mes (imagen 1 crédito, guion 1 crédito de planificación, video a 3 créditos por segundo).
- **Planes públicos** (kaimanstudio.ai/es): Inicial 49 USD / 500 créditos / 1 puesto / 1 GB; Pro 99 USD / 1.200 / 3 puestos / 3 GB; Escala 199 USD / 2.500 / 5 puestos / 5 GB / 5 marcas. Costo por crédito aproximado: 0,098 / 0,0825 / 0,0796 USD.
- **Nota interna**: el catálogo de Wizard lista 1.000 y 2.000 créditos en los planes de 99 y 199 USD. La landing muestra las cifras del sitio público.
- **Paquetes extra**: Boost del catálogo de facturación (100 a 2.500 créditos).
- **Media**: originales en `.media-originals` (ignorado). Publicados en `public/brand`, `public/video`, `public/demos/salsana`. Tres espacios vacíos de recorrido para material posterior.
- **Componentes**: `Button`, `Card`, `Container`, `Switch`, header y footer.

### 2026-10-27 — Project foundation

- **Stack**: Astro + Tailwind CSS v4 (`@tailwindcss/vite`) + TypeScript + i18next; locales `es` (default) and `en` with prefixed routes.
- **Styling policy**: Tailwind utilities only; tokens in `tailwind.config.ts` and `@theme` in `src/styles/global.css`. No component CSS.
- **Copy policy**: Neutral, descriptive, informative. No marketing accentuation.
- **Structure**: `components/layout`, `components/sections`, `i18n/locales/{locale}`, `pages/[locale]`.
- **Initial tokens**: teal brand (`#0f766e`), light surface (`#f8fafc` / white), slate text; IBM Plex Sans as provisional sans/display (swap when brand fonts are defined).
- **Baseline UI**: Header with language switcher, hero with title/subtitle/CTA placeholders, footer with rights line — all copy from i18n dictionaries.
