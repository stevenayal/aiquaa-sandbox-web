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

> Si el proxy responde `502 "No se pudo contactar al backend"` y el log dice
> `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, es un antivirus/proxy corporativo interceptando TLS: el
> fetch server-side de Next no confía en ese certificado. Arrancar con
> `NODE_USE_SYSTEM_CA=1` (ya está en `.claude/launch.json`) lo resuelve usando el almacén de
> certificados del sistema.

## Login en tres capas

No hay JWT ni cookies de sesión — todo vive en `localStorage` del browser:

1. **`/curso` — elegir cohorte.** Lo primero que se pide al entrar: "Curso 1 · Automatización"
   o "Curso 2 · Productos Bancarios" (`sandbox:curso`). Determina qué key se pide después, qué
   login de negocio aplica y qué menú se carga — no hay forma de mezclar módulos de los dos
   cursos en una misma sesión. "Cambiar curso" (en `/login`) lo limpia y vuelve acá.
2. **`/login` — API key del curso elegido.** Pegá la `x-api-key` que te dieron para ese curso.
   Se guarda en su slot (`sandbox:apiKey` para curso 1, `sandbox:apiKeyV2` para curso 2) y se
   manda en cada request al backend a través del proxy. Sin key acá, no se puede entrar a
   ninguna otra pantalla.

   El backend marca cada key con su cohorte (`public.api_keys.curso`) y las rutas de
   `/api/v2/**` responden `403` a cualquier key que no sea de curso 2. `/login` valida la key
   contra ese curso (sondea `GET /v2/usuarios`: `200` ⇒ curso 2, `403` ⇒ curso 1) — si pegaste
   la key del otro curso, no se guarda y el formulario avisa "Esta API key es del curso X,
   elegiste el curso Y."
3. **`/auth/login` — usuario de negocio.** Ingresá el email de un usuario activo (creado antes
   vía "Usuarios" → "Nuevo usuario", o ya existente). No hay contraseña real: el backend solo
   valida que el email corresponda a un usuario activo. El resto de los módulos dependen de
   este `usuario.id`, porque los endpoints piden `usuarioId` explícito.

   En el **curso 2** esta capa resuelve contra los clientes del banco (`GET /v2/usuarios?email=`),
   porque la API v2 no tiene `/auth/login` y sus clientes viven en otro schema. La pantalla de
   "recuperar acceso" (endpoints de v1) queda oculta ahí.

Si el backend responde `401` en cualquier momento (key inválida o revocada a mitad de sesión),
la app limpia la key automáticamente y te manda de vuelta a `/login`.

Para cerrar sesión: botón "Cerrar sesión" en la barra de navegación (limpia las tres capas y
vuelve a `/curso`).

### Modo demo (sin pedir API key)

Si el servidor tiene `SANDBOX_DEMO_API_KEY` (curso 1) o `SANDBOX_DEMO_API_KEY_V2` (curso 2)
configurada (ver `.env.example`), capa 2 desaparece para ese curso:
el proxy inyecta esa key server-side en cada request, sin que el browser la vea nunca — no va al
bundle del cliente, no aparece en `localStorage`, no se puede ver con F12. `/login` sigue
existiendo por si alguien quiere pisarla con su propia key personal (la del browser manda sobre
la demo si está presente).

Son dos variables porque son dos keys distintas: `SANDBOX_DEMO_API_KEY_V2` es la de curso 2 y
es la única que sirve para `/api/v2/**`. Si falta, v2 cae a `SANDBOX_DEMO_API_KEY` (que solo
funciona si esa key ya es de curso 2); y las rutas de v1, al ser agnósticas de cohorte, caen a
la de curso 2 si no hay una de curso 1.

Pensado para demo/uso personal — **no** para un curso con alumnos reales, ahí cada alumno
necesita su propia key para que el rate-limit (30 req/min) y el audit log del backend lo
distingan; una key compartida los mezcla a todos.

## Menú dinámico

El Nav y el home no traen los módulos harcodeados: los piden a `GET /api/menu?curso=&grupo=`,
un route handler de este mismo repo (`app/api/menu/route.ts`) — no pega al backend ni lleva API
key, es configuración del front. Devuelve el mismo envelope `{ data }` / `{ error }` que la API
del sandbox:

```json
GET /api/menu?curso=2&grupo=4
{ "data": { "curso": 2, "grupo": 4, "secciones": [
  { "id": "pagos", "titulo": "Pagos", "items": [
    { "key": "v2-beneficiarios", "href": "/v2/beneficiarios", "label": "Beneficiarios", "productName": "aiquaa Banking", "tagline": "Beneficiarios", "accent": "#4d7c0f", "icon": "contact" }
  ] }
] } }
```

`curso` es obligatorio (`1` o `2`); `grupo` es opcional (sin roster o key demo, sin restricción de
grupo). Un `curso`/`grupo` inválido responde `400 VALIDATION_ERROR`. `lib/menu/modules.ts` tiene
el catálogo (movido de `components/Nav.tsx`) y arma las secciones — en curso 2 agrupadas por
línea de producto (Clientes, Cuentas y tarjetas, Crédito, Pagos, Inversión); en curso 1, una sola.

`lib/menu/useMenu.ts` lo pide con SWR (cruzando el roster del alumno, igual que antes) y lo
consumen `Nav` y `app/page.tsx`, con:

| Estado | testid |
|---|---|
| Cargando | `nav-loading` (Nav) / `home-modules-loading` (home) |
| Error | `nav-error` + botón `nav-retry` / `home-modules-error` + `home-modules-retry` |
| Ítem del menú | `nav-item-{key}` / `home-module-{key}` |
| Página activa | `aria-current="page"` en el link del Nav |

## Convención de selectores (`data-testid`)

Todo elemento pensado para automatizar tiene un `data-testid` kebab-case, siempre sobre HTML
semántico real (`<table>`, `<form>`, `<label htmlFor>`, `<button>` — nunca reemplazándolo):

| Patrón | Uso |
|---|---|
| `{modulo}-loading` / `-error` / `-empty` | Estados de carga de una lista o detalle |
| `{modulo}-count` | Cantidad de resultados de la lista (`"3 resultados"`) |
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
| `{testId}-dialog` | Modal con contenido propio (ej. motivo de bloqueo) — ver [`components/Dialog.tsx`](components/Dialog.tsx) |
| `{modulo}-field-{name}-hint` | Regla o ayuda visible debajo de un campo |
| `{modulo}-form-error` | Error del formulario que no corresponde a un campo puntual |
| `{modulo}-step-{n}` (1-based) / `-step-next` / `-step-back` | Paso actual de un wizard y sus botones de avance/retroceso — ver [`components/Stepper.tsx`](components/Stepper.tsx) |
| `{modulo}-receipt` / `-receipt-{campo}` / `-receipt-print` | Comprobante de una operación terminada — ver [`components/Receipt.tsx`](components/Receipt.tsx) |
| `{modulo}-search` | Cuadro de búsqueda de una lista (debounce de 300 ms) |
| `{modulo}-sort-{columna}` | Botón de orden de una columna (`aria-sort` en el `<th>`) |
| `{modulo}-page-prev` / `-page-next` / `-page-info` | Paginación — ver [`components/list/ListControls.tsx`](components/list/ListControls.tsx) |
| `toast-success` / `toast-error` / `toast-close` | Notificación efímera de éxito/error (5 s) — ver [`components/Toast.tsx`](components/Toast.tsx) |

Búsqueda, orden, filtros y página de una lista viven en la URL (`?q=&sort=&dir=&page=`, más los
filtros propios de cada módulo como `?estado=` o `?usuarioId=`), armados por
[`lib/list/useListControls.ts`](lib/list/useListControls.ts) — todo client-side, porque la API
del curso 2 devuelve hasta 100 filas sin paginar.

### Montos y fechas: `data-value`

Los montos, porcentajes y fechas se muestran formateados (`PYG 5.000.000,00`, `18,00 %`,
`04/09/2026, 02:28`) y llevan el valor crudo del backend en `data-value`
(`"5000000.00"`, `"18.00"`, `"2026-09-04T02:28:11.356Z"`) — ver
[`components/Valores.tsx`](components/Valores.tsx) y [`lib/format.ts`](lib/format.ts).

Para automatizar, asertá contra `data-value`: no depende del locale del browser ni de los
separadores de miles.

```js
await expect(page.getByTestId("v2-cuentas-row-1")
  .locator("[data-value]").first()).toHaveAttribute("data-value", "5000000.00");
```

Definido en [`lib/testids.ts`](lib/testids.ts).

## Módulos

Los 10 grupos del curso, cada uno como página(s) independiente(s) — la forma de cada módulo
sigue la forma real de sus endpoints (no todos tienen list+detail simétrico):

| Módulo | Rutas | Notas |
|---|---|---|
| Usuarios | `/usuarios`, `/usuarios/new`, `/usuarios/[id]` | `[id]` es el hub "Usuario 360": detalle + KYC + sus cuentas, tarjetas, facturas, órdenes, reservas, notificaciones y roles |
| Cuentas | `/cuentas`, `/cuentas/[id]` | List + detail estándar |
| Transferencias | `/transferencias`, `/transferencias/[id]` | Sin lista: la raíz es el form de creación |
| Facturas | `/facturas`, `/facturas/[id]` | Detail incluye mini-form "pagar" |
| Órdenes | `/ordenes`, `/ordenes/new`, `/ordenes/[id]` | `new` tiene items dinámicos (agregar/quitar filas) |
| Tarjetas | `/tarjetas`, `/tarjetas/new`, `/tarjetas/[id]` | Bloquear/activar inline en la lista; el detail edita tipo, marca y límite |
| Notificaciones | `/notificaciones`, `/notificaciones/new`, `/notificaciones/[id]` | Marcar leída inline en la lista |
| Reservas | `/reservas`, `/reservas/new`, `/reservas/[id]` | Confirmar/cancelar inline en la lista |
| Roles | `/roles` | No es list+detail: 4 toggles asignar/revocar contra el usuario logueado |
| Reportes | `/reportes` | Solo lectura, con filtros de fecha |
| Sesiones | `/sesiones`, `/sesiones/new`, `/sesiones/[id]` | Grupo 1: CRUD completo de eventos de auditoría |
| Movimientos | `/movimientos`, `/movimientos/new`, `/movimientos/[id]` | Grupo 9, junto con Reportes |

### Curso 2 — Productos Bancarios (`/v2/**`)

Cohorte aparte: otro schema, otras API keys (ver "Login en tres capas") y 5 grupos propios.
Los nombres se repiten (cuentas, tarjetas, transferencias) pero son recursos distintos de los
del curso 1. Cada módulo tiene validación por campo, listas con búsqueda/orden/paginación en la
URL y las reglas de negocio del banco a la vista (ver "Reglas de UI vs. reglas de la API" abajo).

| Módulo | Rutas | Notas |
|---|---|---|
| Clientes | `/v2/usuarios`, `/v2/usuarios/new`, `/v2/usuarios/[id]` | Transversal: de acá sale el `usuarioId` del resto. Alta en 3 pasos (datos, documento con formato según tipo, revisión); el detail deja el documento en solo lectura |
| Cuentas | `/v2/cuentas`, `/v2/cuentas/new`, `/v2/cuentas/[id]` | Grupo 1. Apertura con tarjetas de tipo/moneda; el detail muestra saldo, bloquear/desbloquear/cerrar según estado y el extracto (débito/crédito separados, paginado) |
| Tarjetas | `/v2/tarjetas`, `/v2/tarjetas/new`, `/v2/tarjetas/[id]` | Grupo 2. Vista del plástico, barra de uso del límite, bloqueo con motivo obligatorio (modal) y vencimiento MM/AAAA |
| Préstamos | `/v2/prestamos`, `/v2/prestamos/new`, `/v2/prestamos/[id]` | Grupo 3. Simulador de cuotas en vivo (misma fórmula que la API) antes de solicitar; el detail aprueba con confirmación y solo deja pagar la próxima cuota pendiente |
| Beneficiarios | `/v2/beneficiarios`, `/v2/beneficiarios/new`, `/v2/beneficiarios/[id]` | Grupo 4, con Transferencias. Banco de una lista de bancos paraguayos, alias único por cliente |
| Transferencias | `/v2/transferencias`, `/v2/transferencias/new`, `/v2/transferencias/[id]` | Grupo 4. La raíz es el historial; el alta es un wizard de 4 pasos (destino → monto → confirmación → comprobante) con tope diario; el detail anula con motivo |
| Ahorros | `/v2/ahorros`, `/v2/ahorros/new`, `/v2/ahorros/[id]` | Grupo 5. Proyecta en cuántos meses se llega a la meta; el detail aporta con tope de saldo de la cuenta |
| Depósitos | `/v2/depositos`, `/v2/depositos/new`, `/v2/depositos/[id]` | Grupo 5. Plazos estándar con tasa sugerida y preview de interés; cancelar antes del vencimiento anticipa el interés prorrateado |

### Reglas de UI vs. reglas de la API (curso 2)

Los módulos del curso 2 replican las reglas del backend (`aiquaa-sandbox-api`, `app/api/v2/**`)
y además agregan reglas propias de la interfaz, **más estrictas** que la API — útil para
practicar la diferencia entre probar la UI y probar la API directamente (un request a la API
con estos datos pasa; por la UI, no):

| Regla de UI | Dónde | La API en cambio... |
|---|---|---|
| Formato de documento según tipo (CI 5-8 dígitos, RUC con dígito verificador, pasaporte alfanumérico) | Alta/edición de clientes | Solo exige que no esté vacío |
| Celular con formato paraguayo (`09XX...` / `+595 9XX...`) | Clientes | Acepta cualquier texto |
| Vencimiento de tarjeta posterior al mes actual y a 5 años como máximo | Emisión/renovación de tarjetas | Solo valida el formato `YYYY-MM-DD` |
| Débito con cuenta asociada obligatoria; Amex solo emite crédito; límite entre 1 y 100 millones | Emisión de tarjetas | Cuenta y límite son opcionales, sin rango |
| Monto de préstamo entre 500 mil y 500 millones; plazos de una lista estándar | Solicitud de préstamos | Acepta cualquier monto > 0 y plazo de 1 a 120 meses |
| Pagar solo la próxima cuota pendiente, en orden | Cuotas de préstamos | Permite pagar cualquier cuota, en cualquier orden |
| Alias de beneficiario único por cliente | Beneficiarios | No lo controla |
| Tope diario de transferencias por cuenta (PYG 50.000.000 / USD 10.000) | Transferencias | Sin límite |
| Motivo obligatorio (10-120 caracteres) para anular una transferencia | Anular transferencia | El motivo es opcional |
| Meta de ahorro máximo a 120 meses según el aporte cargado | Ahorro programado | Sin tope de plazo |
| Monto mínimo de depósito a plazo (PYG 1.000.000) | Depósitos a plazo | Sin mínimo, solo > 0 |

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
- **Carga cognitiva** — montos, porcentajes y fechas formateados en todos los módulos de los
  dos cursos (`1500000.00` → `PYG 1.500.000,00`), con el valor crudo en `data-value` para no
  romper la automatización; y cada lista dice cuántos resultados trajo (`{modulo}-count`),
  que en las de hasta 100 filas evita contar filas a ojo.

## Arquitectura

- **Proxy same-origin**: [`app/api/proxy/[...path]/route.ts`](app/api/proxy/%5B...path%5D/route.ts)
  reenvía todo a `${SANDBOX_API_BASE_URL}/api/v1/...`. El browser solo pega a `/api/proxy/...`
  — cero CORS en ningún lado.
- **Cliente HTTP**: [`lib/api/http.ts`](lib/api/http.ts) (`apiRequest`) + un archivo por grupo
  en `lib/api/`. El prefijo del path elige la cohorte y con ella la key: `v2/cuentas` sale con
  la key de curso 2, `cuentas` con la de curso 1.
- **Data fetching**: [SWR](https://swr.vercel.app), `isLoading` fijo (no `isValidating`) para
  que los estados de carga sean predecibles al automatizar.
- **Auth**: [`lib/auth/`](lib/auth) (`CursoContext`, `ApiKeyContext`, `UsuarioContext`, `AuthGuard`).
- **Menú**: [`lib/menu/modules.ts`](lib/menu/modules.ts) (catálogo) + `GET /api/menu` (ver
  "Menú dinámico") + [`lib/menu/useMenu.ts`](lib/menu/useMenu.ts) (consumo con SWR).
- **Formularios y listas del curso 2**: [`lib/forms/useFormState.ts`](lib/forms/useFormState.ts)
  (validación por campo + mapeo de errores de la API), [`lib/validation/v2.ts`](lib/validation/v2.ts)
  (reglas), [`lib/v2/reglas.ts`](lib/v2/reglas.ts) (simulaciones: préstamos, depósitos, ahorro,
  tope de transferencias) y [`lib/list/useListControls.ts`](lib/list/useListControls.ts)
  (búsqueda/orden/paginación en la URL).

## Deploy (Vercel)

Proyecto Vercel separado del backend. Variables de entorno, ambas server-only:

```
SANDBOX_API_BASE_URL=https://aiquaa-sandbox-api.vercel.app
SANDBOX_DEMO_API_KEY=       # opcional, curso 1 — ver "Modo demo" arriba
SANDBOX_DEMO_API_KEY_V2=    # opcional, curso 2 (key propia: v2 rechaza las de curso 1)
```

Setearlas en Production **y** Preview (`SANDBOX_API_BASE_URL` apuntando siempre a la URL de
producción del backend, no a previews efímeras). Cambiar cualquiera de las keys demo requiere
redeploy — Next.js las lee en build time para derivar los flags públicos
`NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_DEMO_MODE_V1` y `NEXT_PUBLIC_DEMO_MODE_V2`
(ver `next.config.ts` y `lib/auth/demoMode.ts`).
