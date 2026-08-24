FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN corepack enable && pnpm install --frozen-lockfile=false
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN pnpm install --filter events-api --no-frozen-lockfile
RUN pnpm --filter events-api exec prisma generate --schema prisma/schema.prisma && pnpm --filter events-api build && pnpm deploy --filter events-api /prod && cp -r /app/node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.2__typescript@5.9.2/node_modules/.prisma /prod/node_modules/.prisma

FROM node:22-alpine
WORKDIR /app/apps/api
COPY --from=build /prod ./
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
