import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { TicketPriorityBadgeComponent } from '../../shared/components/ticket-priority-badge/ticket-priority-badge.component';
import { TicketStatusBadgeComponent } from '../../shared/components/ticket-status-badge/ticket-status-badge.component';
import { CreateTicketDialogComponent } from '../tickets/components/create-ticket-dialog/create-ticket-dialog.component';
import { TicketStore } from '../tickets/ticket.store';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ButtonModule,
    SkeletonModule,
    TicketStatusBadgeComponent,
    TicketPriorityBadgeComponent,
    CreateTicketDialogComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private readonly store = inject(TicketStore);

  readonly stats = this.store.stats;
  readonly recent = this.store.recentTickets;
  readonly loading = this.store.dashboardLoading;
  readonly error = this.store.error;
  readonly empty = this.store.dashboardEmpty;

  readonly createDialogVisible = signal(false);

  constructor() {
    this.store.loadDashboard();
  }

  retry(): void {
    this.store.loadDashboard();
  }

  openCreate(): void {
    this.createDialogVisible.set(true);
  }

  onTicketCreated(): void {
    this.store.loadDashboard();
  }
}
