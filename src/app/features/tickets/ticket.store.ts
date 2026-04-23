import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, Observable, tap, throwError } from 'rxjs';

import { CreateRequest, ErrorResponse, TicketResponse, TicketSummary } from '../../api';
import { TicketApi } from './ticket-api.service';

export interface Stats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

@Injectable({ providedIn: 'root' })
export class TicketStore {
  private readonly api = inject(TicketApi);

  readonly stats = signal<Stats | null>(null);
  readonly recentTickets = signal<TicketSummary[]>([]);
  readonly dashboardLoading = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly dashboardEmpty = computed(
    () => !this.dashboardLoading() && !this.error() && this.recentTickets().length === 0
  );

  loadDashboard(): void {
    this.dashboardLoading.set(true);
    this.error.set(null);

    forkJoin({
      open: this.api.search({ status: 'OPEN', size: 1 }),
      inProgress: this.api.search({ status: 'IN_PROGRESS', size: 1 }),
      resolved: this.api.search({ status: 'RESOLVED', size: 1 }),
      closed: this.api.search({ status: 'CLOSED', size: 1 }),
      recent: this.api.mine({ size: 5, sort: ['createdAt,desc'] })
    }).subscribe({
      next: ({ open, inProgress, resolved, closed, recent }) => {
        this.stats.set({
          open: open.totalElements ?? 0,
          inProgress: inProgress.totalElements ?? 0,
          resolved: resolved.totalElements ?? 0,
          closed: closed.totalElements ?? 0
        });
        this.recentTickets.set(recent.content ?? []);
        this.dashboardLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.parseError(err).message);
        this.dashboardLoading.set(false);
      }
    });
  }

  create(req: CreateRequest): Observable<TicketResponse> {
    this.creating.set(true);
    this.fieldErrors.set({});
    this.error.set(null);

    return this.api.create(req).pipe(
      tap(() => this.creating.set(false)),
      catchError((err: HttpErrorResponse) => {
        const parsed = this.parseError(err);
        this.fieldErrors.set(parsed.fieldErrors);
        if (Object.keys(parsed.fieldErrors).length === 0) {
          this.error.set(parsed.message);
        }
        this.creating.set(false);
        return throwError(() => err);
      })
    );
  }

  clearFieldErrors(): void {
    this.fieldErrors.set({});
  }

  private parseError(err: HttpErrorResponse): {
    message: string;
    fieldErrors: Record<string, string>;
  } {
    const body = err.error as ErrorResponse | null;
    return {
      message: body?.message ?? body?.error ?? err.statusText ?? 'Request failed',
      fieldErrors: body?.fieldErrors ?? {}
    };
  }
}
