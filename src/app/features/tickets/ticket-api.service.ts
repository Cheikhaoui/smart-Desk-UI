import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  add,
  ApiConfiguration,
  assign,
  CommentCreateRequest,
  CommentResponse,
  CommentUpdateRequest,
  create,
  CreateRequest,
  delete$,
  delete1,
  getById,
  list1,
  mine,
  Mine$Params,
  PageTicketSummary,
  search,
  Search$Params,
  TicketResponse,
  unassign,
  update,
  update1,
  UpdateRequest
} from '../../api';

@Injectable({ providedIn: 'root' })
export class TicketApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  search(params: Search$Params): Observable<PageTicketSummary> {
    return search(this.http, this.config.rootUrl, params).pipe(map((r) => r.body));
  }

  mine(params?: Mine$Params): Observable<PageTicketSummary> {
    return mine(this.http, this.config.rootUrl, params).pipe(map((r) => r.body));
  }

  getById(id: string): Observable<TicketResponse> {
    return getById(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  create(body: CreateRequest): Observable<TicketResponse> {
    return create(this.http, this.config.rootUrl, { body }).pipe(map((r) => r.body));
  }

  update(id: string, body: UpdateRequest): Observable<TicketResponse> {
    return update(this.http, this.config.rootUrl, { id, body }).pipe(map((r) => r.body));
  }

  remove(id: string): Observable<void> {
    return delete$(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  assign(id: string, agentId: string): Observable<TicketResponse> {
    return assign(this.http, this.config.rootUrl, { id, body: { agentId } }).pipe(
      map((r) => r.body)
    );
  }

  unassign(id: string): Observable<TicketResponse> {
    return unassign(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  listComments(ticketId: string): Observable<CommentResponse[]> {
    return list1(this.http, this.config.rootUrl, { ticketId }).pipe(map((r) => r.body));
  }

  addComment(ticketId: string, body: CommentCreateRequest): Observable<CommentResponse> {
    return add(this.http, this.config.rootUrl, { ticketId, body }).pipe(map((r) => r.body));
  }

  updateComment(commentId: string, body: CommentUpdateRequest): Observable<CommentResponse> {
    return update1(this.http, this.config.rootUrl, { commentId, body }).pipe(map((r) => r.body));
  }

  deleteComment(commentId: string): Observable<void> {
    return delete1(this.http, this.config.rootUrl, { commentId }).pipe(map((r) => r.body));
  }
}
