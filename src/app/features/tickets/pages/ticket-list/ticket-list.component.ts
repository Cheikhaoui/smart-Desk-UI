import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';

import { TicketSummary } from '../../../../api';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  TicketPriority,
  TicketPriorityBadgeComponent
} from '../../../../shared/components/ticket-priority-badge/ticket-priority-badge.component';
import {
  TicketStatus,
  TicketStatusBadgeComponent
} from '../../../../shared/components/ticket-status-badge/ticket-status-badge.component';
import { CreateTicketDialogComponent } from '../../components/create-ticket-dialog/create-ticket-dialog.component';
import { TicketStore } from '../../ticket.store';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-ticket-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TicketStatusBadgeComponent,
    TicketPriorityBadgeComponent,
    CreateTicketDialogComponent
  ],
  templateUrl: './ticket-list.component.html'
})
export class TicketListComponent {
  private readonly store = inject(TicketStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly table = viewChild<Table>('table');

  readonly tickets = this.store.tickets;
  readonly totalElements = this.store.totalElements;
  readonly loading = this.store.listLoading;
  readonly error = this.store.listError;
  readonly empty = this.store.listEmpty;

  readonly canFilter = computed(() => this.auth.isAdmin() || this.auth.isAgent());

  readonly statusFilter = signal<TicketStatus | null>(null);
  readonly priorityFilter = signal<TicketPriority | null>(null);
  readonly categoryFilter = signal<string>('');

  readonly createDialogVisible = signal(false);

  readonly statusOptions: SelectOption<TicketStatus>[] = [
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' }
  ];

  readonly priorityOptions: SelectOption<TicketPriority>[] = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' }
  ];

  onLazyLoad(event: TableLazyLoadEvent): void {
    const size = event.rows ?? 20;
    const page = Math.floor((event.first ?? 0) / size);
    const sort = this.resolveSort(event);

    this.store.loadTickets({
      status: this.statusFilter(),
      priority: this.priorityFilter(),
      category: this.categoryFilter().trim() || null,
      page,
      size,
      sort
    });
  }

  applyFilters(): void {
    this.table()?.reset();
  }

  clearFilters(): void {
    this.statusFilter.set(null);
    this.priorityFilter.set(null);
    this.categoryFilter.set('');
    this.applyFilters();
  }

  openCreate(): void {
    this.createDialogVisible.set(true);
  }

  onTicketCreated(): void {
    this.table()?.reset();
  }

  openTicket(ticket: TicketSummary): void {
    if (ticket.id) this.router.navigate(['/tickets', ticket.id]);
  }

  retry(): void {
    this.table()?.reset();
  }

  private resolveSort(event: TableLazyLoadEvent): string {
    const field = typeof event.sortField === 'string' ? event.sortField : 'createdAt';
    const direction = event.sortOrder === 1 ? 'asc' : 'desc';
    return `${field},${direction}`;
  }
}
