/* eslint-disable */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

export interface SuggestReply$Params {
  ticketId: string;
}

export interface SuggestReplyResponse {
  suggestion: string;
}

export function suggestReply(
  http: HttpClient,
  rootUrl: string,
  params: SuggestReply$Params,
  context?: HttpContext
): Observable<StrictHttpResponse<SuggestReplyResponse>> {
  const rb = new RequestBuilder(rootUrl, suggestReply.PATH, 'get');
  if (params) {
    rb.path('ticketId', params.ticketId, {});
  }

  return http
    .request(rb.build({ responseType: 'json', accept: 'application/json', context }))
    .pipe(
      filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => r as StrictHttpResponse<SuggestReplyResponse>)
    );
}

suggestReply.PATH = '/v1/tickets/{ticketId}/comments/suggest';
