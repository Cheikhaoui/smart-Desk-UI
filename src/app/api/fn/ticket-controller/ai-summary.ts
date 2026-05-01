/* eslint-disable */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { TicketResponse } from '../../models/ticket-response';

export interface GenerateAiSummary$Params {
  id: string;
}

export function generateAiSummary(
  http: HttpClient,
  rootUrl: string,
  params: GenerateAiSummary$Params,
  context?: HttpContext
): Observable<StrictHttpResponse<TicketResponse>> {
  const rb = new RequestBuilder(rootUrl, generateAiSummary.PATH, 'post');
  if (params) {
    rb.path('id', params.id, {});
  }

  return http
    .request(rb.build({ responseType: 'json', accept: 'application/json', context }))
    .pipe(
      filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => r as StrictHttpResponse<TicketResponse>)
    );
}

generateAiSummary.PATH = '/v1/tickets/{id}/ai/summary';
