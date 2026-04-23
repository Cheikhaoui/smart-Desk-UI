import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import {
  ApiConfiguration,
  login,
  register,
  RegisterRequest,
  TokenResponse,
  UserResponse
} from '../../api';

const TOKEN_KEY = 'smartdesk:token';
const USER_KEY = 'smartdesk:user';

export type Role = NonNullable<UserResponse['role']>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  readonly token = signal<string | null>(this.loadToken());
  readonly user = signal<UserResponse | null>(this.loadUser());

  readonly isAuthenticated = computed(() => this.token() !== null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  readonly isAgent = computed(() => this.role() === 'AGENT');

  constructor() {
    effect(() => {
      const t = this.token();
      const u = this.user();
      if (t === null) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return;
      }
      localStorage.setItem(TOKEN_KEY, t);
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    });
  }

  login(email: string, password: string): Observable<TokenResponse> {
    return login(this.http, this.config.rootUrl, { body: { email, password } }).pipe(
      map((r) => r.body),
      tap((resp) => this.applyTokenResponse(resp))
    );
  }

  register(body: RegisterRequest): Observable<TokenResponse> {
    return register(this.http, this.config.rootUrl, { body }).pipe(
      map((r) => r.body),
      tap((resp) => this.applyTokenResponse(resp))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
  }

  private applyTokenResponse(resp: TokenResponse): void {
    if (resp.token) this.token.set(resp.token);
    if (resp.user) this.user.set(resp.user);
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): UserResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserResponse;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
