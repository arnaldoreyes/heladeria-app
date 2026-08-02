FROM php:8.4-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm

# Limpiar caché de apt para ahorrar espacio en disco
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar extensiones de PHP (Añadimos opcache)
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd opcache

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configuración de OPcache para Producción (archivo versionado, no generado inline)
COPY docker/app/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Pool de PHP-FPM, reemplaza el www.conf default de la imagen
COPY docker/app/www.conf /usr/local/etc/php-fpm.d/www.conf

# Evitar errores de permisos en Git
RUN git config --global --add safe.directory '*'

# Ajuste de usuario para que coincida con el host (ID 1000)
RUN usermod -u 1000 www-data && groupmod -g 1000 www-data

WORKDIR /var/www

# Cambiamos al usuario www-data por seguridad
# Nunca debemos correr procesos web como root en el VPS
USER www-data

EXPOSE 9000
CMD ["php-fpm"]