import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiConfiguration, list, UserSummary } from '../../api';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  listAgents(): Observable<UserSummary[]> {
    return list(this.http, this.config.rootUrl, { role: 'AGENT' }).pipe(map((r) => r.body));
  }
}
