import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, model, output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { TicketStore } from '../../ticket.store';
import { TicketFormComponent, TicketFormValue } from '../ticket-form/ticket-form.component';

@Component({
  selector: 'app-create-ticket-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule, TicketFormComponent],
  templateUrl: './create-ticket-dialog.component.html'
})
export class CreateTicketDialogComponent {
  private readonly store = inject(TicketStore);
  private readonly messages = inject(MessageService);

  readonly visible = model(false);
  readonly created = output<void>();

  readonly submitting = this.store.creating;
  readonly fieldErrors = this.store.fieldErrors;

  onSubmit(value: TicketFormValue): void {
    this.store
      .create({
        title: value.title,
        description: value.description ?? undefined,
        category: value.category ?? undefined,
        priority: value.priority ?? undefined
      })
      .subscribe({
        next: (ticket) => {
          this.messages.add({
            severity: 'success',
            summary: 'Ticket created',
            detail: ticket.title
          });
          this.visible.set(false);
          this.created.emit();
        },
        error: (err: HttpErrorResponse) => {
          const hasFieldErrors = Object.keys(this.store.fieldErrors()).length > 0;
          if (hasFieldErrors) return;
          this.messages.add({
            severity: 'error',
            summary: 'Create failed',
            detail: this.store.error() ?? err.message
          });
        }
      });
  }

  onCancel(): void {
    this.visible.set(false);
    this.store.clearFieldErrors();
  }
}
