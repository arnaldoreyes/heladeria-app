# Historial de Cambios — Ice King 

Registro de cambios importantes hechos al sistema, en lenguaje simple.

## Cómo se agregan cambios nuevos

Cada actualización futura se agrega como una nueva sección arriba de esta, con su fecha, usando las mismas cuatro categorías:

- **Added** — algo nuevo que no existía antes.
- **Changed** — algo que ya existía, pero cambió cómo funciona.
- **Fixed** — un error que se corrigió.
- **Removed** — algo que se eliminó.

---

## [1.1.1] - 2026-09-05

### Fixed

- Correccion en nombres del namespace
- Correccion en los seeders, rutas y cors del sitio

### Added

- Crecion de comando para migrar de la bdd v1 a la v2
- Creacion de ruta, request y funcion ene l controlador para el registro de usuarios

## [1.0.06] - 2026-08-31

### Added

- Creacion de controladores, rutas y configuraciones de las apis.

## [1.0.05] - 2026-08-31

### Added

- Migracion, resource, request y modelos nuevos y corregidos para la version 2 del sitio, soporte api.

## [1.0.04] - 2026-08-08

### Fixed

- Correccion del scrapper de la tasa BCV para que se actualice autmatomaticamente.
- Correccion de funcionalidades de edicion y borrado masivo de productos en la vista de productos.
- Correccion del selector de categorias del modal de edicion/creacion de productos.
- Ajustes en las vistas de productos y el archivo app.

### Added

-   Nuevo archivo de opcache para entorno de desarrollo.


## [1.0.03] - 2026-08-02

### Fixed

-   Correcciones en el scrapper de la tasa BCV. Cambios en los archivos BcvScraperService, UpdateBcvRate y SettingController.


## [1.0.02] - 2026-08-02

### Fixed

-  Correccion del causante del error 502 en produccion, el problema era en el docker-compose.yml, Claude habia borrado las conexion publica del contenedor app y web.

### Changed

-  Devolver comentado de linea en el dockerfile del commit anterior.

## [1.0.01] - 2026-08-02

### Fixed

- Comentado de linea en el Dockerfile que reemplazaba el archivo de configuración de PHP-FPM (`www.conf`) por uno propio, porque no funcionaba y causaba errores en producción.

## [1.0.0] - 2026-08-02

### Added

- Archivo de configuración separado para acelerar cómo el servidor procesa el código (`opcache.ini`).
- Archivo de configuración del servidor PHP ajustado a los recursos disponibles (`www.conf`).
- Archivo separado para que el entorno de desarrollo (programación) nunca se mezcle con el de producción (uso real).
- Compresión de las respuestas del servidor para que viajen más livianas por internet.
- Guardado en el navegador (caché) de imágenes, estilos y scripts, para cargas más rápidas en visitas repetidas.
- Índices en la base de datos para acelerar búsquedas por fecha en ventas y reposiciones.
- Columna para guardar el costo por producto en cada factura de reposición.
- Este archivo de historial de cambios.

### Changed

- El registro de eventos del sistema ahora guarda solo lo esencial en producción, en vez de todo el detalle técnico (reduce trabajo innecesario del servidor).
- Las sesiones de usuario y los datos temporales ahora se guardan de forma más directa y rápida, en vez de pasar por la base de datos en cada visita.
- La pantalla de historial de reposiciones ahora carga toda la información en un solo paso, en vez de varios pasos separados.
- El cálculo de la tasa del dólar (BCV) ahora se hace en un único lugar del sistema, evitando cálculos repetidos o inconsistentes.
- La contraseña de acceso a la base de datos de producción fue reemplazada por una nueva, única y seguras.

### Fixed

- La tasa oficial del dólar no se actualizaba automáticamente durante fines de semana y feriados bancarios.
- Error al registrar una venta que mostraba un mensaje técnico y no dejaba completar la operación.
- El selector de categorías aparecía vacío al crear un producto nuevo, por datos guardados en caché desactualizados.
- Las facturas de reposición de inventario mostraban $0.00 en el costo de cada producto (el total general sí era correcto). Nota: las facturas creadas antes de esta corrección no pueden actualizarse, porque ese dato nunca llegó a guardarse.

### Removed

- Una herramienta de desarrollo que, por error, corría junto con la aplicación en producción, haciendo que todo el sistema respondiera más lento.
- Cálculo duplicado de la tasa del dólar que existía en dos partes distintas del sistema al mismo tiempo.

---
