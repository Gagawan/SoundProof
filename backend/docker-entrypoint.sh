#!/bin/sh
# Entrypoint du conteneur backend : applique les migrations Prisma puis démarre l'API.
set -e

if [ -f "./prisma/schema.prisma" ]; then
  echo "Application des migrations Prisma…"
  ./node_modules/.bin/prisma migrate deploy
fi

exec node dist/main.js
