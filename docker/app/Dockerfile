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

# Configuración de OPcache para Producción
# Esto le dice a PHP que mantenga el código pre-compilado en RAM
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

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