import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../store/types/api.types';
import { EndpointModel } from '../../../store/types/endpoint.types';
import { getFullEndpointApiUrl } from '../../endpoints/endpoint-helpers';

export interface MetricsEndpointProvider {
  provider: EndpointModel;
  endpoints: EndpointModel[];
}

@Injectable()
export class MetricsService {
  metricsEndpoints$: Observable<MetricsEndpointProvider[]>;
  endpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;
  haveNoMetricsEndpoints$: Observable<boolean>;
  haveNoConnectedMetricsEndpoints$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.endpointsMonitor = this.paginationMonitorFactory.create(
      'endpoint-list',
      entityFactory(endpointSchemaKey)
    );

    this.setupObservables();
  }

  private setupObservables() {
    this.metricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const result: MetricsEndpointProvider[] = [];
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        metrics.forEach(ep => {
          const provider: MetricsEndpointProvider = {
            provider: ep,
            endpoints: [],
          };
          endpoints.forEach(e => {
            if (e.metadata && e.metadata.metrics && e.metadata.metrics === ep.guid) {
              provider.endpoints.push(e);
              e.url = getFullEndpointApiUrl(e);
            }
          });
          result.push(provider);
        });
        return result;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoMetricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        return metrics.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoConnectedMetricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        const connected = metrics.filter(e => !!e.user);
        return connected.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );
  }
}