#!/bin/sh
set -e

# --------------------------------------------------
# Defaults seguros (CRÍTICO com -u)
# --------------------------------------------------
AUTO_KEYGEN="${AUTO_KEYGEN:-true}"
AUTO_MIGRATE="${AUTO_MIGRATE:-true}"
AUTO_SEED="${AUTO_SEED:-true}"
DB_PORT="${DB_PORT:-3306}"

echo "⏳ Waiting for database connection at ${DB_HOST}:${DB_PORT}..."

until php -r "
try {
    \$pdo = new PDO(
        'mysql:host=' . getenv('DB_HOST') .
        ';port=' . getenv('DB_PORT') .
        ';dbname=' . getenv('DB_DATABASE'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD'),
        [
            PDO::ATTR_TIMEOUT => 5,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    );
    \$pdo->query('SELECT 1');
} catch (Throwable \$e) {
    fwrite(STDERR, \$e->getMessage() . PHP_EOL);
    exit(1);
}
"; do
  echo "⏳ MySQL not ready yet..."
  sleep 3
done

echo "✅ Database is available"

cd /var/www

# --------------------------------------------------
# 1. .env automático (README: cp .env.example .env)
# --------------------------------------------------
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "📄 Creating .env from .env.example"
    cp .env.example .env
  else
    echo "❌ Missing .env and .env.example"
    exit 1
  fi
fi


git config --global --add safe.directory /var/www

# --------------------------------------------------
# 2. Composer install (README: composer install)
# --------------------------------------------------
if [ ! -f vendor/autoload.php ]; then
  echo "📦 Installing PHP dependencies (composer)"
  composer install --no-interaction --prefer-dist
fi

# --------------------------------------------------
# 3. Permissões Laravel
# --------------------------------------------------
echo "🔐 Fixing permissions"
mkdir -p storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

# --------------------------------------------------
# 4. APP_KEY (README: php artisan key:generate)
# --------------------------------------------------
if [ "${AUTO_KEYGEN}" = "true" ]; then
  if ! grep -q "^APP_KEY=base64" .env; then
    echo "🔑 Generating APP_KEY"
    php artisan key:generate --force
  fi
fi

# --------------------------------------------------
# 5. Migrations (README: php artisan migrate)
# --------------------------------------------------
if [ "${AUTO_MIGRATE}" = "true" ]; then
  echo "🗄️  Running migrations"
  php artisan migrate --force || {
    echo "❌ Migration failed"
    exit 1
  }
fi

# --------------------------------------------------
# 6. Seed (README: php artisan db:seed)
# --------------------------------------------------
if [ "$AUTO_SEED" = "true" ]; then
  echo "🌱 Checking if database needs seeding"

  USERS_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();")

  if [ "$USERS_COUNT" -eq 0 ]; then
    echo "🌱 Seeding database"
    php artisan db:seed --force
  else
    echo "🌱 Database already seeded — skipping"
  fi
fi




# --------------------------------------------------
# 7. Start PHP
# --------------------------------------------------
echo "🚀 Starting PHP-FPM"
exec /usr/local/sbin/php-fpm -F
