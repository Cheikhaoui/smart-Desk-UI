# layouts/

App shells. A layout is a route wrapper that renders chrome (header, sidebar,
footer) around a `<router-outlet />`. Multiple layouts allow different
chrome per route group — e.g. an authenticated app shell vs a bare auth shell.

Expected layouts:

- `main-layout/` — authenticated shell with sidebar nav, top bar, user menu
- `auth-layout/` — minimal centered card for login/register pages

Layouts wire up via parent routes:

```ts
{
  path: '',
  component: MainLayoutComponent,
  canActivate: [authGuard],
  children: [/* feature routes */]
}
```
