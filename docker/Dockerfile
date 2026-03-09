FROM php:8.4-fpm

# --------------------------------------------------
# System dependencies + Node.js 20 LTS + PHP extensions
# --------------------------------------------------
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    zip \
    bash \
    gnupg \
    ca-certificates \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# Composer
# --------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# --------------------------------------------------
# Workdir
# --------------------------------------------------
WORKDIR /var/www

# --------------------------------------------------
# Prepare Laravel directories (DEV convenience)
# --------------------------------------------------
RUN mkdir -p storage bootstrap/cache \
    && chown -R www-data:www-data /var/www

# --------------------------------------------------
# Align UID with host user (Linux DEV)
# --------------------------------------------------
RUN usermod -u 1000 www-data

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
