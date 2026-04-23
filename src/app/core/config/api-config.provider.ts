import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ApiConfiguration } from '../../api';

const API_BASE_URL = 'http://localhost:8080/api';

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
