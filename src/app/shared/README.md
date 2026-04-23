# shared/

Reusable, **stateless** building blocks. Pure presentational components,
directives, pipes, validators, and cross-cutting types. Anything here must
work in any feature without knowing about the feature.

Expected subfolders:

- `components/` — dumb presentational components (e.g. `EmptyStateComponent`,
  `ConfirmButtonComponent`). Inputs in, outputs out, no service injection.
- `directives/` — attribute directives (e.g. `autoFocus`, `clickOutside`)
- `pipes/` — pure pipes (e.g. `relativeTime`, `truncate`)
- `validators/` — `ValidatorFn` factories for reactive forms
- `models/` — cross-cutting types and DTOs not derived from the OpenAPI spec

If a component talks to a service or holds state, it belongs in a feature
folder, not here.
