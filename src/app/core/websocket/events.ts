import { CommentResponse, TicketSummary } from '../../api';

export interface BaseEvent {
  type: string;
  timestamp: string;
}

export interface TicketCreatedEvent extends BaseEvent {
  type: 'TICKET_CREATED';
  ticket: TicketSummary;
}

export interface TicketUpdatedEvent extends BaseEvent {
  type: 'TICKET_UPDATED';
  ticket: TicketSummary;
}

export interface TicketDeletedEvent extends BaseEvent {
  type: 'TICKET_DELETED';
  ticketId: string;
}

export type TicketEvent = TicketCreatedEvent | TicketUpdatedEvent | TicketDeletedEvent;

export interface CommentAddedEvent extends BaseEvent {
  type: 'COMMENT_ADDED';
  comment: CommentResponse;
}

export type CommentEvent = CommentAddedEvent;

export type NotificationType = 'ASSIGNED' | 'UNASSIGNED' | 'MENTIONED' | 'STATUS_CHANGED';

export interface NotificationEvent extends BaseEvent {
  type: NotificationType;
  ticketId: string;
  ticketTitle: string;
  message: string;
  oldStatus?: string;
  newStatus?: string;
}
