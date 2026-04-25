import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { TicketResponse } from '../../../../api';
import { TicketStore } from '../../ticket.store';
import { TicketFormComponent, TicketFormValue } from '../ticket-form/ticket-form.component';

@Component({
  selector: 'app-edit-ticket-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule, TicketFormComponent],
  templateUrl: './edit-ticket-dialog.component.html'
})
export class EditTicketDialogComponent {
  private readonly store = inject(TicketStore);
  private readonly messages = inject(MessageService);

  readonly visible = model(false);
  readonly ticket = input.required<TicketResponse | null>();
  readonly saved = output<void>();

  readonly submitting = this.store.updating;
  readonly fieldErrors = this.store.fieldErrors;

  onSubmit(value: TicketFormValue): void {
    const id = this.ticket()?.id;
    if (!id) return;

    this.store
      .updateTicket(id, {
        title: value.title,
        description: value.description ?? undefined,
        category: value.category ?? undefined,
        priority: value.priority ?? undefined
      })
      .subscribe({
        next: (ticket) => {
          this.messages.add({
            severity: 'success',
            summary: 'Ticket updated',
            detail: ticket.title
          });
          this.visible.set(false);
          this.saved.emit();
        },
        error: (err: HttpErrorResponse) => {
          const hasFieldErrors = Object.keys(this.store.fieldErrors()).length > 0;
          if (hasFieldErrors) return;
          this.messages.add({
            severity: 'error',
            summary: 'Update failed',
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
