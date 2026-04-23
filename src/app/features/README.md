# features/

One folder per feature, each lazy-loaded via `loadChildren`. A feature is a
vertical slice — it owns its routes, pages, components, services, and store.

Conventions per feature folder:

- `<feature>.routes.ts` — route config exported as `default` for `loadChildren`
- `pages/` — smart components (one per route, talk to services)
- `components/` — presentational components specific to this feature
- `<feature>.store.ts` — signal-based state holder (`providedIn: 'root'`
  only if shared cross-feature, otherwise scoped to the route)
- `<feature>-api.service.ts` — thin wrapper around generated API client if
  the feature needs orchestration (cache, optimistic updates, etc.)

Cross-feature dependencies are an anti-smell. If two features need the same
thing, lift it to `core/` (stateful) or `shared/` (stateless).
