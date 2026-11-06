# Dirección visual para imágenes del blog

## Referencias

El estilo sale de las portadas e imágenes interiores del blog publicado en https://www.kaimanstudio.ai/es/: med spas, salones de uñas, agencias, bufetes, restaurantes y realtors (revisadas el 3 de noviembre de 2026). Todas siguen la misma fórmula:

- **Primer plano:** el dueño o profesional del sector, de espaldas o por encima del hombro y con la cara casi oculta, trabaja con lápiz en una tablet o con un portátil, sobre un mostrador o escritorio con objetos del oficio.
- **Plano medio:** de 4 a 7 tarjetas grandes de cristal esmerilado, blancas y lila con bordes violeta y azul luminosos. Están unidas por líneas y flechas brillantes que forman un flujo de marketing. Cada tarjeta lleva una foto realista del sector (clientes, productos, resultados) y un icono redondeado en una esquina: calendario, sobre, corona, regalo, estrella, campana, gráfico de crecimiento, check o escudo. A veces un pequeño robot asistente hace de nodo central.
- **Fondo:** el negocio real del sector, premium y reconocible, desenfocado.
- **Luz:** ambiente cálido de atardecer o primera hora de la noche (luces ámbar, velas, puesta de sol) mezclado con el brillo violeta y azul de las tarjetas. Imagen vibrante, bien expuesta y nítida. Nunca lúgubre ni subexpuesta.
- **Portada e interior son de la misma familia:** el mismo escenario recompuesto. La portada (16:9) dispone las tarjetas como un flujo de izquierda a derecha; la interior (9:16) las apila en red en los dos tercios superiores.

## Sin texto

Las referencias publicadas incluyen algo de texto (días de un calendario, un cartel «FOR SALE») y logos de redes sociales. En las generaciones nuevas **no se admite ningún texto**: el modelo produce letras ilegibles que no tienen sentido. Donde una interfaz mostraría texto se dibujan barras redondeadas lisas. Tampoco se usan logos de marcas ni de redes sociales; se sustituyen por iconos genéricos (cámara, sobre, burbuja de chat).

## Cómo se combina con el Word

El Word aporta el **concepto**, no la imagen literal. El prompt (`imagePrompts` en `src/server/blog-images.ts`) se arma así:

1. Formato y composición de la pieza (portada 16:9, interior 9:16 o 3:2).
2. **Concepto del artículo**, marcado como «solo inspiración»: título, entradilla, texto alternativo y prompt del Word. Sirve para elegir el sector, el escenario y la idea de marketing, que se expresan mediante las fotos de las tarjetas y sus iconos. Se ignoran la luz, el ambiente, el color, el estilo y los textos de pantalla que pida.
3. **Estilo de la casa** (`IMAGE_HOUSE_STYLE`), al final, con prioridad sobre lo anterior.

Ejemplo: un Word que pide «interfaz de neón con niveles de membresía en un ambiente oscuro» da un med spa al atardecer con tarjetas de clientes, una corona (membresía), un regalo (beneficios) y un gráfico de crecimiento, sin rótulos.

## Revisión

- El texto alternativo describe la imagen para accesibilidad y no se dibuja en ella. Si el del Word describe algo distinto de la imagen final (por ejemplo, «escena oscura de neón»), hay que corregirlo en el editor.
- Las imágenes se comparten entre idiomas; el alt y el pie se mantienen localizados.
- Revisar cada pareja antes de publicar y regenerarla si no encaja. Cada regeneración consume créditos.

El estilo se aplica mediante instrucciones al modelo y debe comprobarse con generaciones reales. La detección automática de contradicciones entre prompt y alt no está implementada.
