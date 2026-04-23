import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { TicketResponse } from '../../../../api';

export type TicketFormMode = 'create' | 'edit';

export interface TicketFormValue {
  title: string;
  description: string | null;
  category: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
}

const PRIORITY_OPTIONS: { label: string; value: TicketFormValue['priority'] }[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' }
];

@Component({
  selector: 'app-ticket-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './ticket-form.component.html'
})
export class TicketFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly mode = input.required<TicketFormMode>();
  readonly initialValue = input<TicketResponse | null>(null);
  readonly submitting = input(false);
  readonly fieldErrors = input<Record<string, string>>({});

  readonly submitted = output<TicketFormValue>();
  readonly cancelled = output<void>();

  readonly priorityOptions = PRIORITY_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: [''],
    category: [''],
    priority: [null as TicketFormValue['priority']]
  });

  readonly submitLabel = computed(() =>
    this.mode() === 'create' ? 'Create Ticket' : 'Save Changes'
  );

  constructor() {
    effect(() => {
      const initial = this.initialValue();
      if (!initial) return;
      this.form.patchValue({
        title: initial.title ?? '',
        description: initial.description ?? '',
        category: initial.category ?? '',
        priority: initial.priority ?? null
      });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.submitted.emit({
      title: raw.title,
      description: raw.description || null,
      category: raw.category || null,
      priority: raw.priority
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
