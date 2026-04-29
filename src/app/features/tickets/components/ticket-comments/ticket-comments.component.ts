import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';

import { CommentResponse } from '../../../../api';
import { AuthService } from '../../../../core/auth/auth.service';
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
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly ticketId = input.required<string>();

  readonly comments = this.store.comments;
  readonly loading = this.store.commentsLoading;
  readonly error = this.store.commentsError;
  readonly submitting = this.store.addingComment;
  readonly fieldErrors = this.store.commentFieldErrors;

  readonly empty = computed(() => !this.loading() && !this.error() && this.comments().length === 0);
  readonly currentUserId = computed(() => this.auth.user()?.id ?? null);

  readonly editingId = signal<string | null>(null);
  readonly editValue = signal<string>('');
  readonly savingEdit = signal(false);

  readonly form = this.fb.nonNullable.group({
    content: ['', [Validators.required]]
  });

  canManage(c: CommentResponse): boolean {
    return c.author?.id === this.currentUserId() || this.auth.isAdmin();
  }

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
      next: () => this.form.reset({ content: '' }),
      error: (err: HttpErrorResponse) => {
        if (Object.keys(this.fieldErrors()).length > 0) return;
        this.messages.add({ severity: 'error', summary: 'Comment failed', detail: err.message });
      }
    });
  }

  startEdit(c: CommentResponse): void {
    if (!c.id) return;
    this.editingId.set(c.id);
    this.editValue.set(c.content ?? '');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editValue.set('');
  }

  saveEdit(c: CommentResponse): void {
    if (!c.id) return;
    const content = this.editValue().trim();
    if (!content) return;

    this.savingEdit.set(true);
    this.store.updateComment(c.id, content).subscribe({
      next: () => {
        this.savingEdit.set(false);
        this.editingId.set(null);
        this.editValue.set('');
      },
      error: (err: HttpErrorResponse) => {
        this.savingEdit.set(false);
        this.messages.add({ severity: 'error', summary: 'Update failed', detail: err.message });
      }
    });
  }

  deleteComment(c: CommentResponse): void {
    if (!c.id) return;
    const id = c.id;
    this.confirm.confirm({
      message: 'Delete this comment?',
      header: 'Delete comment',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.deleteComment(id).subscribe({
          next: () => this.messages.add({ severity: 'success', summary: 'Comment deleted' }),
          error: (err: HttpErrorResponse) =>
            this.messages.add({ severity: 'error', summary: 'Delete failed', detail: err.message })
        });
      }
    });
  }

  initial(name: string | undefined): string {
    return name?.charAt(0).toUpperCase() ?? '?';
  }
}
