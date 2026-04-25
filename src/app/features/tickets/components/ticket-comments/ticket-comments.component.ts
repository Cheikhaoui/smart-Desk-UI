import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';

import { TicketStore } from '../../ticket.store';

@Component({
  selector: 'app-ticket-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, SkeletonModule, TextareaModule],
  templateUrl: './ticket-comments.component.html'
})
export class TicketCommentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(TicketStore);
  private readonly messages = inject(MessageService);

  readonly ticketId = input.required<string>();

  readonly comments = this.store.comments;
  readonly loading = this.store.commentsLoading;
  readonly error = this.store.commentsError;
  readonly submitting = this.store.addingComment;
  readonly fieldErrors = this.store.commentFieldErrors;

  readonly empty = computed(() => !this.loading() && !this.error() && this.comments().length === 0);

  readonly form = this.fb.nonNullable.group({
    content: ['', [Validators.required]]
  });

  retry(): void {
    this.store.loadComments(this.ticketId());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const content = this.form.getRawValue().content.trim();
    if (!content) return;

    this.store.addComment(this.ticketId(), content).subscribe({
      next: () => {
        this.form.reset({ content: '' });
      },
      error: (err: HttpErrorResponse) => {
        if (Object.keys(this.fieldErrors()).length > 0) return;
        this.messages.add({
          severity: 'error',
          summary: 'Comment failed',
          detail: err.message
        });
      }
    });
  }

  initial(name: string | undefined): string {
    return name?.charAt(0).toUpperCase() ?? '?';
  }
}
