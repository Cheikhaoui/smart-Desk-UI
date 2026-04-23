# SmartDesk Frontend — Project Guide for Claude

## Project overview
SmartDesk is an AI-powered helpdesk system. This is the Angular frontend that
consumes the SmartDesk backend (Spring Boot at http://localhost:8080/api).
This is my job-market portfolio piece — aim for senior-level code at all times.

## Stack
- Angular 18+ (standalone components, no NgModules)
- TypeScript 5 (strict mode ON)
- Angular Signals for component state
- RxJS for async streams (HTTP, WebSocket)
- PrimeNG 17+ (UI component library) with PrimeFlex or Tailwind for layout
- PrimeIcons for iconography
- Tailwind CSS for utility styling (layout, spacing, custom tweaks)
- ng-openapi-gen for auto-generated API client from backend's OpenAPI spec
- @stomp/stompjs for WebSocket (no SockJS)
- ESLint + Prettier

## Architecture
Feature-based structure mirroring the backend's vertical slices:

```
src/app/
├── app.config.ts              # standalone app bootstrap
├── app.routes.ts              # top-level routes with lazy loading
├── app.component.ts
│
├── core/                      # app-wide singletons
│   ├── auth/                  # AuthService, auth guard, JWT interceptor
│   ├── http/                  # error interceptor, loading interceptor
│   ├── websocket/             # StompService wrapper
│   └── config/                # environment config
│
├── shared/                    # reusable across features
│   ├── components/            # buttons, dialogs, empty-states
│   ├── directives/
│   ├── pipes/
│   └── models/                # cross-cutting types
│
├── features/                  # one folder per feature — lazy loaded
│   ├── auth/                  # login, register pages
│   ├── tickets/               # list, detail, form
│   ├── dashboard/
│   └── settings/
│
├── api/                       # AUTO-GENERATED from OpenAPI — never edit by hand
│   ├── services/
│   └── models/
│
└── layouts/                   # app shell layouts (main, auth-layout)
```

NEVER create `components/`, `services/`, `models/` as top-level folders.
Each feature owns its own slice.

## Code conventions (enforce these strictly)

### Components
- **Standalone components only.** No NgModules.
- **OnPush change detection** everywhere by default.
- **Signals for local state**, RxJS for async streams. Don't mix unnecessarily.
- **`input()` / `output()` signal APIs**, not `@Input()` / `@Output()` decorators
  (Angular 17.3+).
- Template files separate (`.html`) for anything over ~15 lines, inline for small
  components.
- SCSS only for component-specific styles; Tailwind for layout and utilities.
- **Smart vs presentational** — feature pages talk to services, child components
  receive inputs and emit outputs. Keep presentational components dumb.

### Services
- `providedIn: 'root'` for singletons.
- **One service per responsibility** — `TicketApiService` (HTTP), `TicketStore`
  (state), `TicketUiService` (dialogs/toasts). Don't mash everything into one.
- Inject with `inject()` function, not constructor params — modern Angular idiom.

### State management
- **Signals-first.** Use `signal()`, `computed()`, `effect()` for component and
  feature state. No NgRx unless genuinely needed for complex flows.
- Per-feature **store services** (`TicketStore`) hold state in signals.
- `computed()` for derived values, never store what can be derived.
- If a feature genuinely needs NgRx, justify it. Default is signals.

### HTTP
- ALL HTTP calls go through the **auto-generated API client** in `src/app/api/`.
- Never write `this.http.get(...)` directly in feature code — go through the
  generated service.
- Regenerate the client with `npm run api:gen` whenever the backend changes.
- JWT added automatically by `authInterceptor` — never add the header manually.

### Routing
- **Lazy load every feature.** `loadChildren: () => import('./features/tickets/tickets.routes')`
- **Route guards as functions**, not classes (`canActivate: [authGuard]`).
- Routing data for page titles via `title: 'Tickets'` in route config.

### Forms
- **Reactive forms**, never template-driven.
- `FormBuilder` via `inject()`, typed `FormGroup<T>`.
- Custom validators as pure functions, one per file in `shared/validators/`.

### Async / RxJS
- Use `toSignal()` to bridge observables into signals.
- Use `takeUntilDestroyed()` to auto-unsubscribe — no manual `ngOnDestroy`.
- Prefer `switchMap` over `mergeMap` for user-triggered actions.

### Error handling
- `httpErrorInterceptor` catches HTTP errors, extracts the backend's
  `ErrorResponse` shape (`{timestamp, status, error, message, fieldErrors}`),
  and surfaces a toast.
- 401 → redirect to login and clear auth state.
- Field errors (`fieldErrors`) applied to form controls when shown as a form.

## Naming conventions
- **Files:** kebab-case — `ticket-list.component.ts`, `auth.service.ts`
- **Classes:** PascalCase with type suffix — `TicketListComponent`, `AuthService`
- **Selectors:** `app-` prefix — `<app-ticket-list>`
- **Signals:** noun, not verb — `tickets`, not `getTickets`
- **Observables:** `$` suffix — `tickets$`
- **Types vs interfaces:** prefer `type` for unions/DTOs, `interface` for
  extensible contracts

## Backend API contract
Backend base URL: `http://localhost:8080/api` (dev), configurable via environment.

Auth endpoints:
- `POST /v1/auth/register` → returns `{ token, expiresIn, user }`
- `POST /v1/auth/login` → returns `{ token, expiresIn, user }`

Protected endpoints require `Authorization: Bearer <token>` header.

Ticket endpoints (auth required):
- `POST /v1/tickets` — create
- `GET /v1/tickets?status=&priority=&category=&page=&size=&sort=` — paginated
- `GET /v1/tickets/{id}` — detail
- `PATCH /v1/tickets/{id}` — partial update
- `DELETE /v1/tickets/{id}` — admin only

Error response shape:
```json
{
  "timestamp": "2026-04-18T12:34:56Z",
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid request",
  "path": "/api/v1/tickets",
  "fieldErrors": { "title": "Title is required" }
}
```

## WebSocket (planned)
- Endpoint: `ws://localhost:8080/api/ws`
- STOMP protocol, native WebSocket (no SockJS)
- JWT sent via STOMP CONNECT `Authorization` header
- Subscriptions:
  - `/topic/tickets` — broadcast ticket events
  - `/user/queue/notifications` — private per-user notifications
- Use `@stomp/stompjs` directly, wrapped in a `StompService` in `core/websocket/`.

## OpenAPI client regeneration
Config file: `ng-openapi-gen.json` at project root.
Command: `npm run api:gen`
- Fetches `http://localhost:8080/api/v3/api-docs`
- Generates TypeScript services + models into `src/app/api/`
- Commit generated files to git (source of truth at build time)
- Never edit files in `src/app/api/` by hand

## How to run
```bash
# Dev server
ng serve

# Regenerate API client (run after backend changes)
npm run api:gen

# Production build
ng build --configuration production

# Lint + format
npm run lint
npm run format
```

## Working style with Claude
- I'm a senior developer — skip basic explanations, go deep on design tradeoffs
- Explain senior patterns (signals vs observables, smart/dumb components,
  lazy loading) when introducing them
- When I ask "what is X", explain the concept + why it matters + the senior tradeoff
- One feature at a time. Ask before assuming scope.
- Prefer modern Angular (signals, standalone, new control flow `@if`/`@for`)
  over legacy patterns
- If I propose something sub-optimal, push back and suggest the senior approach
- Wait for my "next" before moving to the next file in a multi-file scope

## UI library — PrimeNG (locked in)
- **Theme:** Aura (PrimeNG's modern default, light + dark mode support via
  `PrimeNGConfig.ripple` and theme CSS)
- **Import components standalone** per feature, never globally. Each component
  that uses `p-table` imports `TableModule` directly.
- **Layout:** use Tailwind for layout/spacing (`flex`, `gap-4`, `p-6`),
  PrimeNG for controls (tables, dialogs, forms, menus).
- **Don't mix two icon sets.** PrimeIcons only (`pi pi-user`), never import
  Material Icons or Lucide alongside.
- **Toast messages** via PrimeNG `MessageService` + one `<p-toast>` in the root
  layout. Don't use `alert()` or manual divs.
- **Confirmation dialogs** via `ConfirmationService` + `<p-confirmDialog>` in
  the root layout.
- **Forms:** use `p-inputtext`, `p-dropdown`, `p-calendar`, `p-password` with
  Reactive Forms. Bind validation errors to PrimeNG's `[invalid]` state.

## Not yet decided — ask me when relevant
- i18n strategy (if needed)
- Testing approach beyond Angular's default Jasmine/Karma (Vitest migration?)

## What's built so far
Nothing — starting from scratch. First tasks:
1. `ng new smartdesk-frontend --standalone --routing --style=scss --strict`
2. Install PrimeNG + PrimeIcons + Tailwind CSS
3. Configure PrimeNG Aura theme in `angular.json` styles
4. Set up `<p-toast>` and `<p-confirmDialog>` in the root layout
5. Configure `ng-openapi-gen` pointing to backend's OpenAPI spec
6. Set up `core/auth/` — AuthService, authGuard, authInterceptor
7. Build login + register pages (use `p-card`, `p-password`, `p-button`)
8. Build ticket list (`p-table`) + detail + create form (`p-dialog`)
9. Add WebSocket integration for live updates