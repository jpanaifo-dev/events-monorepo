# Events Portal

Portal SSR multiinstitución en Astro. Cada institución se resuelve por slug:

- `/{institution}` lista eventos publicados.
- `/{institution}/events/{eventId}` muestra detalle, agenda y formulario disponible.

Configura `PUBLIC_API_URL` con la URL pública del API, por ejemplo `http://localhost:3010/api`.
