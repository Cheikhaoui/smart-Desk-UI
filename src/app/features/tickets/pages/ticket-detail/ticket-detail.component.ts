import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { CommentEvent } from '../../../../core/websocket/events';
import { StompService } from '../../../../core/websocket/stomp.service';
import { TicketPriorityBadgeComponent } from '../../../../shared/components/ticket-priority-badge/ticket-priority-badge.component';
import { TicketStatusBadgeComponent } from '../../../../shared/components/ticket-status-badge/ticket-status-badge.component';
import { AssigneeControlComponent } from '../../components/assignee-control/assignee-control.component';
import { EditTicketDialogComponent } from '../../components/edit-ticket-dialog/edit-ticket-dialog.component';
import { TicketCommentsComponent } from '../../components/ticket-comments/ticket-comments.component';
import { TicketStore } from '../../ticket.store';

@Component({
  selector: 'app-ticket-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ButtonModule,
    SkeletonModule,
    TicketStatusBadgeComponent,
    TicketPriorityBadgeComponent,
    EditTicketDialogComponent,
    TicketCommentsComponent,
    AssigneeControlComponent
  ],
  templateUrl: './ticket-detail.component.html'
})
export class TicketDetailComponent {
  private readonly store = inject(TicketStore);
  private readonly router = inject(Router);
  private readonly stomp = inject(StompService);

  readonly id = input.required<string>();

  readonly ticket = this.store.currentTicket;
  readonly loading = this.store.detailLoading;
  readonly error = this.store.detailError;

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
}
