# core/

App-wide singletons. Imported once, used everywhere. **Never** put feature
code or anything that mounts a UI here.

Expected subfolders:

- `auth/` — `AuthService`, `authGuard`, `authInterceptor`, JWT helpers
- `http/` — error and loading interceptors, generic HTTP utilities
- `websocket/` — `StompService` wrapper around `@stomp/stompjs`
- `config/` — environment config, runtime tokens, API base URL
- `theme/` — `ThemeService` (light/dark mode, signal-based)

Rule of thumb: if more than one feature imports it and it's stateful, it
belongs here. If only one feature imports it, keep it inside that feature.
