# 🍦 Ice King Popsicle - Sistema POS e Inventario

**Ice King Popsicle** es un sistema de Punto de Venta (POS), control de inventario y analítica contable diseñado específicamente para heladerías y negocios similares que operan en economías multimoneda (como la venezolana). La aplicación permite facturar en Dólares ($) y Bolívares (Bs.), adaptándose dinámicamente a la tasa de cambio oficial en tiempo real.

---

## 🚀 Stack Tecnológico

La aplicación está construida sobre una arquitectura moderna, rápida y altamente estructurada:

*   **Backend:** [Laravel 11.x](https://laravel.com) (PHP 8.x) - Proporciona una base sólida con Eloquent ORM, migraciones ordenadas, transacciones de base de datos seguras y un sistema de tareas programadas (Cron).
*   **Frontend:** [React 18](https://react.dev) - Interfaz de usuario dinámica, interactiva y responsiva.
*   **Conexión Backend-Frontend:** [Inertia.js](https://inertiajs.com) - Permite construir la aplicación SPA (Single Page Application) utilizando enrutamiento y controladores nativos de Laravel, compartiendo el estado global sin necesidad de escribir APIs REST complejas.
*   **Diseño y Estilos:** [Tailwind CSS](https://tailwindcss.com) y CSS Vanilla - Estilizado limpio, moderno y responsivo con soporte nativo de **Modo Oscuro / Modo Claro** (persistido en local storage).
*   **Iconos:** [Material Symbols Outlined](https://fonts.google.com/icons) de Google.
*   **Entorno de Contenedores:** Docker configurado mediante un archivo `docker-compose.yml` multi-servicio.

---

## 🛠️ Funcionalidades al Detalle

### 1. Punto de Venta (POS) Interactivo
*   **Venta en una Sola Pantalla:** Selección rápida de helados con visualizador de stock en tiempo real.
*   **Precios Dinámicos:** Muestra los precios en USD ($) y realiza la conversión inmediata a Bolívares (Bs.) basándose en la tasa oficial activa del día.
*   **Métodos de Pago:** Soporta cobros mediante **Pago Móvil**, **Divisas** (efectivo en dólares) y **Efectivo** (efectivo en bolívares).
*   **Control de Fugas Cambiarias:** Al pagar en efectivo en bolívares, si el cliente paga menos del monto exacto por falta de cambio o redondeo, el sistema calcula la diferencia y la registra en el campo `change_loss_bs` (fuga).
*   **Edición Segura de Ventas:** Permite modificar tickets de venta del **día actual**. El controlador devuelve temporalmente el inventario de los productos anteriores, limpia el ticket viejo, evalúa el stock del nuevo carrito (usando bloqueos de fila contra condiciones de carrera) y actualiza el total, manteniendo el inventario y la contabilidad perfectamente auditables.

### 2. Panel de Control Financiero (Dashboard)
*   **Distribución Automática de Caja:** Separa los ingresos brutos del mes en curso entre el **Fondo del Negocio** (por defecto 60%) y tu **Ganancia Personal** (por defecto 40%), de acuerdo con las reglas de distribución configuradas.
*   **Ganancia Real vs. Teórica:** Resta de forma automática las pérdidas por fugas cambiarias directamente de tu porción de ganancias, calculando tu rentabilidad real.
*   **Histórico Mensual:** Barra lateral desplegable que recopila el número de ventas, ingresos totales y pérdidas cambiarias acumuladas mes a mes.

### 3. Analítica Avanzada de Finanzas
*   **Comportamiento de Demanda:** Gráficos e indicadores automáticos que muestran cuál es el **Día Más Fuerte** de ventas de la semana y la **Hora Pico** del negocio basándose en la fecha de creación de los tickets.
*   **Top 5 de Productos:** Clasificación de los helados más vendidos del negocio.
*   **Caja Libre del Negocio:** Calcula los fondos acumulados del negocio menos las compras de mercancía (Inversión en Reposición), proporcionando la caja líquida real para gastos operativos.

### 4. Control de Inventario y Reabastecimiento
*   **CRUD Completo:** Creación, edición y eliminación de helados y categorías.
*   **Edición Masiva:** Permite seleccionar múltiples productos para actualizar sus precios o stock en lote, o eliminarlos conjuntamente.
*   **Sistema de Restock Transaccional:** Permite ingresar facturas de compra (en USD/Bs.). El sistema registra la compra global, detalla qué productos ingresaron y aumenta automáticamente el stock físico de las paletas de forma transaccional.

### 5. Configuración Cambiaria Inteligente (Tasa BCV Diferida)
*   **Referencia Cambiaria:** Permite elegir entre tasa manual y automática.
*   **Scraper Oficial del BCV:** En modo automático, la aplicación realiza scraping al sitio oficial del Banco Central de Venezuela (`https://www.bcv.org.ve/`) mediante XPath.
*   **Actualización Programada (Diferida):**
    *   *El Problema:* El BCV suele publicar la tasa del día siguiente a las 4:00 - 6:00 PM del día anterior. Si la tasa se actualizara de inmediato, afectaría los cobros del cierre de la jornada de hoy.
    *   *La Solución:* Si el scraper detecta una tasa futura (ej: tasa del martes publicada el lunes por la tarde), la guarda en estado **programado** (`bcv_next_rate` y `bcv_next_date`).
    *   La tasa programada **solo se activa automáticamente a las 12:01 am** del día en que entra en vigencia.
    *   Las tasas publicadas los viernes por la tarde para el lunes se mantienen programadas durante todo el fin de semana, manteniendo activa la tasa del viernes en el sistema hasta el lunes a medianoche.
    *   El caché del sistema (`tasa_bcv_global`) calcula su tiempo de vida dinámicamente para expirar en la medianoche de la hora de Caracas, garantizando el refresco exacto de la tasa al iniciar el nuevo día.

---

## ⚙️ Instalación y Despliegue Local (Docker)

Para ejecutar la aplicación localmente en tu máquina usando Docker:

### 1. Requisitos Previos
*   Tener instalado **Git**, **Docker** y **Docker Compose**.
*   Si estás en Windows, se recomienda utilizar el backend de **WSL2 (Windows Subsystem for Linux)**.

### 2. Pasos de Instalación
1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio> heladeria-app
    cd heladeria-app
    ```

2.  **Configurar las variables de entorno:**
    Copia el archivo de ejemplo y edítalo si es necesario (el archivo predeterminado está configurado para la red interna de Docker):
    ```bash
    cp .env.example .env
    ```

3.  **Iniciar los contenedores de Docker:**
    Levanta la infraestructura de base de datos MySQL, PHP-FPM, Nginx y Cron en segundo plano:
    ```bash
    docker-compose up -d
    ```

4.  **Instalar dependencias del Backend:**
    Instala los paquetes de PHP mediante composer dentro del contenedor de la aplicación:
    ```bash
    docker exec -it ice_king_app composer install
    ```

5.  **Generar la clave de la aplicación Laravel:**
    ```bash
    docker exec -it ice_king_app php artisan key:generate
    ```

6.  **Instalar dependencias del Frontend y compilar assets:**
    ```bash
    docker exec -it ice_king_app npm install
    ```
    *Nota: El servidor de desarrollo Vite (`npm run dev`) se ejecuta de forma automática en segundo plano al levantar los contenedores mediante Docker.*

7.  **Poblar la Base de Datos:**
    Elige una de las dos opciones para sembrar tu base de datos:

    *   **Opción A: Base de datos limpia con catálogo inicial (Recomendada para producción/negocio real)**
        Prepara las tablas e instala el catálogo de helados predeterminado con stock inicial:
        ```bash
        docker exec -it ice_king_app php artisan migrate:fresh --seed
        ```
        *(Esta opción utiliza `InitialDataSeeder` de forma predeterminada).*

    *   **Opción B: Base de datos con historial de demostración de 3 meses (Recomendada para pruebas o grabar videos)**
        Si deseas probar el sistema con datos de ventas falsos distribuidos en los últimos 90 días, entra temporalmente al archivo [DatabaseSeeder.php](file:///wsl.localhost/Ubuntu/home/arnaldo/proyectos/heladeria-app/database/seeders/DatabaseSeeder.php), descomenta `DemoDataSeeder::class` y corre:
        ```bash
        docker exec -it ice_king_app php artisan migrate:fresh --seed
        ```
        Esto creará:
        *   **1 Usuario Administrador:** `admin@iceking.com` / Contraseña: `password`.
        *   **Más de 1,100 ventas** realistas distribuidas en los últimos 3 meses.
        *   Histórico de compras de mercancía (Restocks) y productos con stock disponible para vender.

8.  **¡Listo! Acceder a la aplicación:**
    *   Abre tu navegador e ingresa a: **`http://localhost:8000`**
    *   Para ingresar a las rutas de gestión, inicia sesión con el usuario administrador.

---

## ⌨️ Comandos Clave del Sistema

El sistema cuenta con comandos de consola útiles que se ejecutan automáticamente en el cron interno de Docker, pero también puedes ejecutarlos manualmente:

*   **Actualizar Tasa BCV y promover tasas diferidas:**
    Conéctate a la web del BCV, extrae la tasa actual, agenda tasas futuras y promueve la tasa correspondiente si el día ha cambiado:
    ```bash
    docker exec -it ice_king_app php artisan bcv:update-rate
    ```

*   **Limpiar Caché del Sistema (Tasa y vistas):**
    Si modificas alguna regla contable o cambias el dólar manual y deseas forzar la recarga:
    ```bash
    docker exec -it ice_king_app php artisan cache:clear
    ```

---

## 🔒 Licencia
Este software es privado y está protegido para el uso exclusivo del negocio **Ice King Popsicle**.
