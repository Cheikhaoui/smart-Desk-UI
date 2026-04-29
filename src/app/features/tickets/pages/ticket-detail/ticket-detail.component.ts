import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { AuthService } from '../../../../core/auth/auth.service';
import { CommentEvent } from '../../../../core/websocket/events';
import { StompService } from '../../../../core/websocket/stomp.service';
import { TicketPriorityBadgeComponent } from '../../../../shared/components/ticket-priority-badge/ticket-priority-badge.component';
import { AssigneeControlComponent } from '../../components/assignee-control/assignee-control.component';
import { EditTicketDialogComponent } from '../../components/edit-ticket-dialog/edit-ticket-dialog.component';
import { StatusControlComponent } from '../../components/status-control/status-control.component';
import { TicketCommentsComponent } from '../../components/ticket-comments/ticket-comments.component';
import { TicketStore } from '../../ticket.store';

@Component({
  selector: 'app-ticket-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ButtonModule,
    SkeletonModule,
    TicketPriorityBadgeComponent,
    EditTicketDialogComponent,
    TicketCommentsComponent,
    AssigneeControlComponent,
    StatusControlComponent
  ],
  templateUrl: './ticket-detail.component.html'
})
export class TicketDetailComponent {
  private readonly store = inject(TicketStore);
  private readonly router = inject(Router);
  private readonly stomp = inject(StompService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly id = input.required<string>();

  readonly ticket = this.store.currentTicket;
  readonly loading = this.store.detailLoading;
  readonly error = this.store.detailError;
  readonly deleting = this.store.deleting;

  readonly canDelete = computed(() => this.auth.isAdmin());

  readonly editDialogVisible = signal(false);

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      this.store.loadTicket(id);
      this.store.loadComments(id);

      const sub = this.stomp
        .watch<CommentEvent>(`/topic/tickets/${id}/comments`)
        .subscribe((event) => this.store.applyCommentEvent(event));

      onCleanup(() => sub.unsubscribe());
    });
  }

  back(): void {
    this.router.navigateByUrl('/tickets');
  }

  retry(): void {
    this.store.loadTicket(this.id());
  }

  openEdit(): void {
    this.editDialogVisible.set(true);
  }

  onSaved(): void {
    // store.currentTicket already updated by updateTicket's tap
  }

  onDelete(): void {
    this.confirm.confirm({
      message: 'Delete this ticket? This cannot be undone.',
      header: 'Delete ticket',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.deleteTicket(this.id()).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Ticket deleted' });
            this.router.navigateByUrl('/tickets');
          },
          error: (err: HttpErrorResponse) =>
            this.messages.add({
              severity: 'error',
              summary: 'Delete failed',
              detail: err.message
            })
        });
      }
    });
  }
}
