# aiquaa Sandbox Web

Frontend objetivo para practicar automatización de UI (Selenium/Playwright/Cypress,
BDD/Gherkin) contra una app de negocio realista. Consume [aiquaa-sandbox-api](../aiquaa-sandbox-api)
vía un proxy same-origin — el browser nunca habla directo con el backend.

## Arrancar en local

1. Backend corriendo en otra terminal (repo `aiquaa-sandbox-api`, puerto `3000` por default):
   ```bash
   npm run dev
   ```
2. En este repo, copiar `.env.example` a `.env.local` y ajustar `SANDBOX_API_BASE_URL` si hace
   falta (por default apunta a `http://localhost:3000`).
3. Instalar e iniciar (puerto `3001`, fijo para no chocar con el backend):
   ```bash
   npm install
   npm run dev
   ```
4. Abrir [http://localhost:3001](http://localhost:3001).

## Login en dos capas

No hay JWT ni cookies de sesión — todo vive en `localStorage` del browser:

1. **`/login` — API key.** Pegá la `x-api-key` que te dieron para el sandbox. Se guarda en
   `localStorage` y se manda en cada request al backend a través del proxy. Sin key acá, no
   se puede entrar a ninguna otra pantalla.
2. **`/auth/login` — usuario de negocio.** Ingresá el email de un usuario activo (creado antes
   vía "Usuarios" → "Nuevo usuario", o ya existente). No hay contraseña real: el backend solo
   valida que el email corresponda a un usuario activo. El resto de los módulos dependen de
   este `usuario.id`, porque los endpoints piden `usuarioId` explícito.

Si el backend responde `401` en cualquier momento (key inválida o revocada a mitad de sesión),
la app limpia la key automáticamente y te manda de vuelta a `/login`.

Para cerrar sesión: botón "Cerrar sesión" en la barra de navegación (limpia ambas capas).

### Modo demo (sin pedir API key)

Si el servidor tiene `SANDBOX_DEMO_API_KEY` configurada (ver `.env.example`), capa 1 desaparece:
el proxy inyecta esa key server-side en cada request, sin que el browser la vea nunca — no va al
bundle del cliente, no aparece en `localStorage`, no se puede ver con F12. `/login` sigue
existiendo por si alguien quiere pisarla con su propia key personal (la del browser manda sobre
la demo si está presente).

Pensado para demo/uso personal — **no** para un curso con alumnos reales, ahí cada alumno
necesita su propia key para que el rate-limit (30 req/min) y el audit log del backend lo
distingan; una key compartida los mezcla a todos.

## Convención de selectores (`data-testid`)

Todo elemento pensado para automatizar tiene un `data-testid` kebab-case, siempre sobre HTML
semántico real (`<table>`, `<form>`, `<label htmlFor>`, `<button>` — nunca reemplazándolo):

| Patrón | Uso |
|---|---|
| `{modulo}-loading` / `-error` / `-empty` | Estados de carga de una lista o detalle |
| `{modulo}-list` | Contenedor de la tabla/lista |
| `{modulo}-row-{id}` | Fila individual |
| `{modulo}-row-{id}-{accion}` | Botón de acción sobre una fila (ej. `tarjetas-row-3-bloquear`) |
| `{modulo}-form` | Formulario |
| `{modulo}-field-{name}` | Campo de formulario |
| `{modulo}-field-{name}-error` | Error de validación de un campo |
| `{modulo}-submit` | Botón de submit |
| `{modulo}-detail` | Contenedor de una vista de detalle |
| `{modulo}-success` | Mensaje de confirmación (`role="status"`) |
| `{testId}-confirm-dialog` / `-confirm-accept` / `-confirm-cancel` | Modal de confirmación (`role="alertdialog"`) antes de una acción irreversible — ver [`components/ConfirmDialog.tsx`](components/ConfirmDialog.tsx) |

Definido en [`lib/testids.ts`](lib/testids.ts).

## Módulos

Los 10 grupos del curso, cada uno como página(s) independiente(s) — la forma de cada módulo
sigue la forma real de sus endpoints (no todos tienen list+detail simétrico):

| Módulo | Rutas | Notas |
|---|---|---|
| Usuarios | `/usuarios/new`, `/usuarios/[id]` | Sin "listar todos"; `[id]` es detalle + cambio de estado KYC |
| Cuentas | `/cuentas`, `/cuentas/[id]` | List + detail estándar |
| Transferencias | `/transferencias`, `/transferencias/[id]` | Sin lista: la raíz es el form de creación |
| Facturas | `/facturas`, `/facturas/[id]` | Detail incluye mini-form "pagar" |
| Órdenes | `/ordenes`, `/ordenes/new`, `/ordenes/[id]` | `new` tiene items dinámicos (agregar/quitar filas) |
| Tarjetas | `/tarjetas`, `/tarjetas/new` | Sin detail; bloquear/activar inline en la lista |
| Notificaciones | `/notificaciones`, `/notificaciones/new` | Sin detail; marcar leída inline en la lista |
| Reservas | `/reservas`, `/reservas/new` | Sin detail (el backend no expone `GET /reservas/{id}`); confirmar/cancelar inline |
| Roles | `/roles` | No es list+detail: 4 toggles asignar/revocar contra el usuario logueado |
| Reportes | `/reportes` | Solo lectura, con filtros de fecha |

## Buenas prácticas de UX aplicadas

Basado en las [30 leyes de UX](https://lawsofux.com/es/). Ya estaban resueltas de fábrica:
tokens de espaciado/color consistentes (Proximidad, Semejanza, Prägnanz), estados
loading/error/empty estándar (`DataState`) y botones deshabilitados con label en progreso
durante toda acción async (Umbral de Doherty), y auto-relleno del `usuarioId` desde la
sesión (Ley de Tesler). Se sumó:

- **Ley de Fitts** — objetivos táctiles de 44×44px mínimo en botones, links de nav e
  inputs (`components/shared.module.css`, `Nav.module.css`, páginas de login).
- **Regla de Fin de Pico** — confirmación explícita (`components/ConfirmDialog.tsx`,
  `role="alertdialog"`) antes de bloquear una tarjeta, cancelar una reserva o revocar un
  rol: son acciones difíciles de deshacer para el usuario del sandbox.
- **Ley de Postel** — los emails se normalizan (`trim` + `toLowerCase`, ver
  `lib/format.ts`) antes de mandarse al backend, en login, recuperar acceso y alta de
  usuario.
- **Atención selectiva** — el total estimado de una orden nueva se resalta brevemente al
  recalcularse, para que un cambio de cantidad/precio no pase desapercibido.

## Arquitectura

- **Proxy same-origin**: [`app/api/proxy/[...path]/route.ts`](app/api/proxy/%5B...path%5D/route.ts)
  reenvía todo a `${SANDBOX_API_BASE_URL}/api/v1/...`. El browser solo pega a `/api/proxy/...`
  — cero CORS en ningún lado.
- **Cliente HTTP**: [`lib/api/http.ts`](lib/api/http.ts) (`apiRequest`) + un archivo por grupo
  en `lib/api/`.
- **Data fetching**: [SWR](https://swr.vercel.app), `isLoading` fijo (no `isValidating`) para
  que los estados de carga sean predecibles al automatizar.
- **Auth**: [`lib/auth/`](lib/auth) (`ApiKeyContext`, `UsuarioContext`, `AuthGuard`).

## Deploy (Vercel)

Proyecto Vercel separado del backend. Variables de entorno, ambas server-only:

```
SANDBOX_API_BASE_URL=https://aiquaa-sandbox-api.vercel.app
SANDBOX_DEMO_API_KEY=       # opcional — ver "Modo demo" arriba
```

Setearlas en Production **y** Preview (`SANDBOX_API_BASE_URL` apuntando siempre a la URL de
producción del backend, no a previews efímeras). Cambiar `SANDBOX_DEMO_API_KEY` requiere
redeploy — Next.js la lee en build time para derivar el flag público `NEXT_PUBLIC_DEMO_MODE`
(ver `next.config.ts`).
