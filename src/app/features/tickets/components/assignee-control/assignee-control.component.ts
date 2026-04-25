import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { TicketResponse } from '../../../../api';
import { AuthService } from '../../../../core/auth/auth.service';
import { TicketStore } from '../../ticket.store';

@Component({
  selector: 'app-assignee-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonModule, SelectModule],
  templateUrl: './assignee-control.component.html'
})
export class AssigneeControlComponent {
  private readonly store = inject(TicketStore);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  readonly ticket = input.required<TicketResponse>();

  readonly canManage = computed(() => this.auth.isAdmin() || this.auth.isAgent());
  readonly currentUserId = computed(() => this.auth.user()?.id ?? null);

  readonly assignee = computed(() => this.ticket().assignedTo ?? null);
  readonly assignedToMe = computed(() => {
    const a = this.assignee();
    const me = this.currentUserId();
    return !!a && !!me && a.id === me;
  });

  readonly agents = this.store.agents;
  readonly agentsLoading = this.store.agentsLoading;
  readonly assigning = this.store.assigning;

  openPicker(): void {
    this.store.loadAgents();
  }

  takeTicket(): void {
    const me = this.currentUserId();
    const ticketId = this.ticket().id;
    if (!me || !ticketId) return;
    this.store.assign(ticketId, me).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'Ticket assigned to you' }),
      error: (err: HttpErrorResponse) => this.showError(err, 'Assign failed')
    });
  }

  assignTo(agentId: string): void {
    const ticketId = this.ticket().id;
    if (!ticketId || !agentId) return;
    if (agentId === this.assignee()?.id) return;
    this.store.assign(ticketId, agentId).subscribe({
      next: (t) =>
        this.messages.add({
          severity: 'success',
          summary: 'Assigned',
          detail: t.assignedTo?.fullName
        }),
      error: (err: HttpErrorResponse) => this.showError(err, 'Assign failed')
    });
  }

  unassign(): void {
    const ticketId = this.ticket().id;
    if (!ticketId) return;
    this.store.unassign(ticketId).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'Ticket unassigned' }),
      error: (err: HttpErrorResponse) => this.showError(err, 'Unassign failed')
    });
  }

  private showError(err: HttpErrorResponse, summary: string): void {
    this.messages.add({ severity: 'error', summary, detail: err.message });
  }
}
