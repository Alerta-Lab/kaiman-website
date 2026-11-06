# Categorías y palabras clave del blog

## Uso editorial

- **Categoría:** el sector al que se dirige el artículo, por ejemplo «Restaurantes». Se selecciona una y se comparte entre las versiones en español e inglés.
- **Palabras clave:** temas concretos del artículo, por ejemplo «menús de temporada» y «fidelización». Pueden ser distintas para cada tema y se pueden reutilizar entre artículos.

Al importar un tema del Word, la IA intenta asignar una categoría y hasta seis palabras clave. Puede reutilizar términos existentes o proponer nuevos. El resultado se aplica a las versiones del tema y debe revisarse. Volver a pulsar «Sugerir categoría y palabras clave con IA» reemplaza la clasificación existente en todas las versiones; el editor solicita confirmación.

En el editor se pueden buscar y seleccionar palabras clave existentes, quitar las seleccionadas o crear una nueva. La nueva palabra se guarda al guardar el artículo. El límite actual es de ocho por versión. La lista usa la traducción inglesa de las palabras existentes cuando está disponible.

Al editar manualmente las palabras clave se actualiza la versión guardada; no se traducen ni se sincronizan automáticamente con la otra versión. Revisar ambas versiones antes de publicar. La clasificación con IA sí actúa sobre el grupo de traducciones.

## Catálogo compartido

El administrador conserva una pantalla «Palabras clave» para crear, renombrar o eliminar términos compartidos. Los cambios pueden afectar a varios artículos. Actualmente renombrar una palabra clave cambia su slug y, por tanto, su URL pública; eliminarla también afecta a sus asociaciones. Revisar estos efectos antes de hacer limpieza del catálogo.

Las palabras clave se muestran como temas y aparecen en datos estructurados del artículo. Son una ayuda de organización y señal semántica; no garantizan indexación ni posicionamiento en buscadores.

## Nota para implementación

«Palabras clave» es el nombre visible para el usuario. Se conservan `tags` y las rutas existentes por compatibilidad con los datos y enlaces actuales; no hace falta una migración para el cambio de nombre. El selector actual no cambia el diseño visual definitivo que pueda definir Carlos.
