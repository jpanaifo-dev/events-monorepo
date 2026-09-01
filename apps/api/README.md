# Events API

Backend NestJS para reemplazar gradualmente el acceso directo del panel a Supabase.

## Desarrollo local

1. Copia `.env.example` a `.env`.
2. Levanta PostgreSQL: `docker compose up -d postgres`.
3. Instala dependencias: `pnpm install`.
4. Genera Prisma: `pnpm --filter events-api prisma:generate`.
5. Crea la primera migración: `pnpm --filter events-api prisma:migrate --name init`.
6. Inicia el API: `pnpm --filter events-api dev`.

Health check: `GET http://localhost:3000/api/health`.

El modelo conserva los nombres funcionales usados actualmente por el panel. Antes de importar producción hay que comparar `prisma/schema.prisma` con un dump real de la base Supabase para preservar columnas, índices, triggers y políticas existentes.
