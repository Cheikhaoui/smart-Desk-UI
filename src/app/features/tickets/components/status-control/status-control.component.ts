import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { TicketResponse, UpdateRequest } from '../../../../api';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  TicketStatus,
  TicketStatusBadgeComponent
} from '../../../../shared/components/ticket-status-badge/ticket-status-badge.component';
import { TicketStore } from '../../ticket.store';

@Component({
  selector: 'app-status-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectModule, TicketStatusBadgeComponent],
  templateUrl: './status-control.component.html'
})
export class StatusControlComponent {
  private readonly store = inject(TicketStore);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  readonly ticket = input.required<TicketResponse>();

  readonly canChange = computed(() => this.auth.isAdmin() || this.auth.isAgent());
  readonly status = computed<TicketStatus | null>(() => this.ticket().status ?? null);
  readonly updating = this.store.updating;

  readonly statusOptions: { label: string; value: TicketStatus }[] = [
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' }
  ];

  onChange(newStatus: TicketStatus): void {
    const id = this.ticket().id;
    if (!id || newStatus === this.status()) return;
    const body: UpdateRequest = { status: newStatus };
    this.store.updateTicket(id, body).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'Status updated' }),
      error: (err: HttpErrorResponse) =>
        this.messages.add({ severity: 'error', summary: 'Update failed', detail: err.message })
    });
  }
}
