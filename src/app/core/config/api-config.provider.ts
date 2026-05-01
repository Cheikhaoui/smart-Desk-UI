import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ApiConfiguration } from '../../api';
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiBaseUrl;

export function provideApiConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ApiConfiguration,
      useFactory: () => {
        const config = new ApiConfiguration();
        config.rootUrl = API_BASE_URL;
        return config;
      }
    }
  ]);
}
