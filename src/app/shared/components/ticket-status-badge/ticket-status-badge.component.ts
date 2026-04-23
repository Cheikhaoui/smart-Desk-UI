import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

import type { TicketResponse } from '../../../api';

export type TicketStatus = NonNullable<TicketResponse['status']>;

type Severity = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';

const SEVERITY: Record<TicketStatus, Severity> = {
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'secondary'
};

const LABEL: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed'
};

@Component({
  selector: 'app-ticket-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagModule],
  template: `<p-tag [severity]="severity()" [value]="label()" />`
})
export class TicketStatusBadgeComponent {
  readonly status = input.required<TicketStatus>();

  readonly severity = computed<Severity>(() => SEVERITY[this.status()]);
  readonly label = computed<string>(() => LABEL[this.status()]);
}
