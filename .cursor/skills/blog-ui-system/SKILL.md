---
name: blog-ui-system
description: Construye y revisa interfaces del blog Kaiman con Atomic Design, Tailwind, Lucide y WCAG 2.2 AA. Usar al crear o modificar componentes, páginas públicas o el panel administrativo.
---

# Sistema UI de Kaiman Blog

## Reglas obligatorias
1. Coloca primitivas en `src/components/ui/atoms`, composiciones pequeñas en `molecules`, secciones en `organisms` y estructuras de página en `templates`.
2. Mantén consulta de datos y estado de negocio en `src/features`, hooks o `src/server`; los componentes UI son presentacionales.
3. Usa exclusivamente tokens y utilidades de Tailwind. No añadas estilos inline, valores arbitrarios ni CSS específico de componentes.
4. Usa `font-headline` para títulos (Space Grotesk) y `font-body font-medium` para texto (Quicksand 500).
5. Usa iconos de `lucide-react`, con `aria-hidden` si son decorativos y etiqueta accesible si son la única señal de una acción.
6. Conserva objetivos táctiles de al menos 44×44 px, foco visible, contraste AA, HTML semántico, labels persistentes, errores anunciados y navegación completa por teclado.
7. Todo estado asíncrono debe tener loading, error, vacío y éxito. Confirma acciones destructivas y no dependas solo del color.
8. Verifica responsive desde 320 px y zoom al 200 % sin pérdida de contenido.

## Flujo de creación
1. Busca una primitiva existente antes de crear otra.
2. Diseña la API tipada y el nombre semántico.
3. Implementa la variante mínima requerida.
4. Prueba teclado, lector de pantalla, contraste y estados.
5. Documenta atajos o comportamiento no evidente.

## Lista de revisión
- Atomic Design y separación frontend/servicios respetados.
- No hay CSS o estilos inline de componentes.
- Tokens de `tailwind.config.ts` reutilizados.
- WCAG 2.2 AA y focus visible comprobados.
- Texto e iconos tienen nombres accesibles.
- La página funciona sin JavaScript cuando la interacción no lo requiere.
