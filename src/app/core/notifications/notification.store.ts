import { computed, Injectable, signal } from '@angular/core';

import { NotificationEvent, NotificationType } from '../websocket/events';

export interface AppNotification {
  id: string;
  type: NotificationType;
  ticketId: string;
  ticketTitle: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  readonly notifications = signal<AppNotification[]>([]);

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  push(event: NotificationEvent): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type: event.type,
      ticketId: event.ticketId,
      ticketTitle: event.ticketTitle,
      message: event.message,
      timestamp: new Date(event.timestamp),
      read: false
    };
    this.notifications.update((list) => [notification, ...list].slice(0, 30));
  }

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  clear(): void {
    this.notifications.set([]);
  }
}
