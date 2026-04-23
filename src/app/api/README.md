# api/ — AUTO-GENERATED, DO NOT EDIT

This folder is regenerated from the SmartDesk backend's OpenAPI spec by
`ng-openapi-gen`. Any hand edits will be overwritten.

To regenerate (requires backend running at `http://localhost:8080`):

```bash
npm run api:gen
```

Configuration: [`ng-openapi-gen.json`](../../../ng-openapi-gen.json)

Output structure:

- `services/` — Angular services, one per OpenAPI tag (e.g. `TicketService`)
- `models/` — TypeScript interfaces for every schema in the spec
- `fn/` — per-operation function generators (used internally by services)
- `index.ts` — barrel export

Feature code should import from the barrel: `from 'src/app/api'`. Never
write `this.http.get('/api/v1/tickets')` directly — go through the
generated service.

`removeStaleFiles` is set to `false` so this README survives regeneration.
If the backend removes an endpoint, manually delete the orphaned service
file.
