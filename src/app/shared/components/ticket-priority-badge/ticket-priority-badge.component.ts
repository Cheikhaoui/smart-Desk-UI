import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

import type { TicketResponse } from '../../../api';

export type TicketPriority = NonNullable<TicketResponse['priority']>;

type Severity = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';

const SEVERITY: Record<TicketPriority, Severity> = {
  LOW: 'secondary',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger'
};

const LABEL: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

@Component({
  selector: 'app-ticket-priority-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagModule],
  template: `<p-tag [severity]="severity()" [value]="label()" />`
})
export class TicketPriorityBadgeComponent {
  readonly priority = input.required<TicketPriority>();

  readonly severity = computed<Severity>(() => SEVERITY[this.priority()]);
  readonly label = computed<string>(() => LABEL[this.priority()]);
}
