# One image serves web + api (ADR-0005). Node 24 runs the API's TypeScript directly (type stripping), so
# there's no API build step.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# better-sqlite3 ships prebuilt binaries for every platform, but npm would still run node-gyp (because of
# its binding.gyp) and slim images have no compiler. No other production package has an install script.
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build -w @nutrigo/web && npm prune --omit=dev

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATABASE_PATH=/data/nutrigo.db WEB_ROOT=/app/apps/web/dist
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/web/dist ./apps/web/dist
# Runs as root on purpose: bind-mounted ./data on Linux and Railway volumes are root-owned, so a
# non-root user couldn't write the database. The app is single-user and protected at the edge (ADR-0002).
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:' + process.env.PORT + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "apps/api/src/index.ts"]
