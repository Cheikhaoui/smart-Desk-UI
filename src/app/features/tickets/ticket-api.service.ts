import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  ApiConfiguration,
  create,
  CreateRequest,
  mine,
  Mine$Params,
  PageTicketSummary,
  search,
  Search$Params,
  TicketResponse
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

  create(body: CreateRequest): Observable<TicketResponse> {
    return create(this.http, this.config.rootUrl, { body }).pipe(map((r) => r.body));
  }
}
