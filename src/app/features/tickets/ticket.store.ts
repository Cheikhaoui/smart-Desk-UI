import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, Observable, tap, throwError } from 'rxjs';

import {
  CommentResponse,
  CreateRequest,
  ErrorResponse,
  TicketResponse,
  TicketSummary,
  UpdateRequest,
  UserSummary
} from '../../api';
import { AuthService } from '../../core/auth/auth.service';
import { UserApi } from '../../core/users/user-api.service';
import { CommentEvent, TicketEvent, TicketUpdatedEvent } from '../../core/websocket/events';
import { StompService } from '../../core/websocket/stomp.service';
import { TicketPriority } from '../../shared/components/ticket-priority-badge/ticket-priority-badge.component';
import { TicketStatus } from '../../shared/components/ticket-status-badge/ticket-status-badge.component';
import { TicketApi } from './ticket-api.service';

export interface Stats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface ListParams {
  status: TicketStatus | null;
  priority: TicketPriority | null;
  category: string | null;
  page: number;
  size: number;
  sort: string;
}

@Injectable({ providedIn: 'root' })
export class TicketStore {
  private readonly api = inject(TicketApi);
  private readonly userApi = inject(UserApi);
  private readonly auth = inject(AuthService);
  private readonly stomp = inject(StompService);

  readonly stats = signal<Stats | null>(null);
  readonly recentTickets = signal<TicketSummary[]>([]);
  readonly dashboardLoading = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly tickets = signal<TicketSummary[]>([]);
  readonly totalElements = signal(0);
  readonly listLoading = signal(false);
  readonly listError = signal<string | null>(null);

  readonly currentTicket = signal<TicketResponse | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly updating = signal(false);

  readonly comments = signal<CommentResponse[]>([]);
  readonly commentsLoading = signal(false);
  readonly commentsError = signal<string | null>(null);
  readonly addingComment = signal(false);
  readonly commentFieldErrors = signal<Record<string, string>>({});

  readonly agents = signal<UserSummary[]>([]);
  readonly agentsLoading = signal(false);
  readonly assigning = signal(false);

  readonly dashboardEmpty = computed(
    () => !this.dashboardLoading() && !this.error() && this.recentTickets().length === 0
  );

  readonly listEmpty = computed(
    () => !this.listLoading() && !this.listError() && this.tickets().length === 0
  );

  constructor() {
    this.stomp.watch<TicketEvent>('/topic/tickets').subscribe((event) => {
      this.applyTicketEvent(event);
    });
  }

  applyCommentEvent(event: CommentEvent): void {
    if (event.type !== 'COMMENT_ADDED') return;
    this.comments.update((list) =>
      list.some((c) => c.id === event.comment.id) ? list : [...list, event.comment]
    );
  }

  private applyTicketEvent(event: TicketEvent): void {
    const isPrivileged = this.auth.isAdmin() || this.auth.isAgent();

    if (isPrivileged) {
      switch (event.type) {
        case 'TICKET_CREATED':
          this.tickets.update((list) =>
            list.some((t) => t.id === event.ticket.id) ? list : [event.ticket, ...list]
          );
          this.totalElements.update((n) => n + 1);
          break;
        case 'TICKET_UPDATED':
          this.tickets.update((list) =>
            list.map((t) => (t.id === event.ticket.id ? event.ticket : t))
          );
          break;
        case 'TICKET_DELETED':
          this.tickets.update((list) => list.filter((t) => t.id !== event.ticketId));
          this.totalElements.update((n) => Math.max(0, n - 1));
          break;
      }
    }

    const current = this.currentTicket();
    if (!current?.id) return;
    if (this.isUpdatedEvent(event) && event.ticket.id === current.id) {
      this.loadTicket(current.id);
    } else if (event.type === 'TICKET_DELETED' && event.ticketId === current.id) {
      this.currentTicket.set(null);
      this.detailError.set('This ticket was deleted.');
    }
  }

  private isUpdatedEvent(event: TicketEvent): event is TicketUpdatedEvent {
    return event.type === 'TICKET_UPDATED';
  }

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

  loadTickets(params: ListParams): void {
    this.listLoading.set(true);
    this.listError.set(null);

    const isPrivileged = this.auth.isAdmin() || this.auth.isAgent();
    const sort = [params.sort];

    const request$ = isPrivileged
      ? this.api.search({
          status: params.status ?? undefined,
          priority: params.priority ?? undefined,
          category: params.category ?? undefined,
          page: params.page,
          size: params.size,
          sort
        })
      : this.api.mine({
          page: params.page,
          size: params.size,
          sort
        });

    request$.subscribe({
      next: (page) => {
        this.tickets.set(page.content ?? []);
        this.totalElements.set(page.totalElements ?? 0);
        this.listLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.listError.set(this.parseError(err).message);
        this.listLoading.set(false);
      }
    });
  }

  loadTicket(id: string): void {
    this.detailLoading.set(true);
    this.detailError.set(null);

    this.api.getById(id).subscribe({
      next: (ticket) => {
        this.currentTicket.set(ticket);
        this.detailLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.detailError.set(this.parseError(err).message);
        this.detailLoading.set(false);
      }
    });
  }

  clearCurrentTicket(): void {
    this.currentTicket.set(null);
    this.detailError.set(null);
    this.comments.set([]);
    this.commentsError.set(null);
  }

  loadComments(ticketId: string): void {
    this.commentsLoading.set(true);
    this.commentsError.set(null);

    this.api.listComments(ticketId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.commentsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.commentsError.set(this.parseError(err).message);
        this.commentsLoading.set(false);
      }
    });
  }

  addComment(ticketId: string, content: string): Observable<CommentResponse> {
    this.addingComment.set(true);
    this.commentFieldErrors.set({});

    return this.api.addComment(ticketId, { content }).pipe(
      tap((comment) => {
        this.comments.update((list) => [...list, comment]);
        this.addingComment.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const parsed = this.parseError(err);
        this.commentFieldErrors.set(parsed.fieldErrors);
        this.addingComment.set(false);
        return throwError(() => err);
      })
    );
  }

  clearCommentFieldErrors(): void {
    this.commentFieldErrors.set({});
  }

  loadAgents(): void {
    if (this.agentsLoading() || this.agents().length > 0) return;
    this.agentsLoading.set(true);
    this.userApi.listAgents().subscribe({
      next: (agents) => {
        this.agents.set(agents);
        this.agentsLoading.set(false);
      },
      error: () => {
        this.agentsLoading.set(false);
      }
    });
  }

  assign(ticketId: string, agentId: string): Observable<TicketResponse> {
    this.assigning.set(true);
    return this.api.assign(ticketId, agentId).pipe(
      tap((ticket) => {
        this.currentTicket.set(ticket);
        this.assigning.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.assigning.set(false);
        return throwError(() => err);
      })
    );
  }

  unassign(ticketId: string): Observable<TicketResponse> {
    this.assigning.set(true);
    return this.api.unassign(ticketId).pipe(
      tap((ticket) => {
        this.currentTicket.set(ticket);
        this.assigning.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.assigning.set(false);
        return throwError(() => err);
      })
    );
  }

  updateTicket(id: string, req: UpdateRequest): Observable<TicketResponse> {
    this.updating.set(true);
    this.fieldErrors.set({});
    this.error.set(null);

    return this.api.update(id, req).pipe(
      tap((ticket) => {
        this.currentTicket.set(ticket);
        this.updating.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        const parsed = this.parseError(err);
        this.fieldErrors.set(parsed.fieldErrors);
        if (Object.keys(parsed.fieldErrors).length === 0) {
          this.error.set(parsed.message);
        }
        this.updating.set(false);
        return throwError(() => err);
      })
    );
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
