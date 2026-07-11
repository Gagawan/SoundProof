# ---- Stage 1 : build (compilation TypeScript) ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Génération du client Prisma (sans effet tant que le schéma n'existe pas)
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi
RUN npm run build
# Ne conserver que les dépendances de production pour le stage runtime
RUN npm prune --omit=dev

# ---- Stage 2 : runtime minimal (utilisateur non-root) ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
COPY docker-entrypoint.sh ./

# L'image node fournit l'utilisateur non privilégié « node »
USER node

EXPOSE 3000

# Healthcheck sur l'endpoint /api/v1/health (module Health, voir docs/04)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/v1/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# L'entrypoint applique les migrations Prisma puis démarre l'API (voir docs/01 § 2.7)
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
