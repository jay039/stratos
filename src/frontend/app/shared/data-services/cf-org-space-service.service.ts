import { Injectable, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { distinctUntilChanged, map, tap, withLatestFrom } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../core/cf-api.types';
import { GetAllOrganizations } from '../../store/actions/organization.actions';
import { AppState } from '../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../store/helpers/entity-relations.types';
import {
  getCurrentPageRequestInfo,
  getPaginationObservables,
} from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { endpointsRegisteredEntitiesSelector } from '../../store/selectors/endpoint.selectors';
import { EndpointModel } from '../../store/types/endpoint.types';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';
import { APIResource } from '../../store/types/api.types';

export interface CfOrgSpaceItem<T = any> {
  list$: Observable<T[]>;
  loading$: Observable<boolean>;
  select: BehaviorSubject<string>;
}

export const enum CfOrgSpaceSelectMode {
  FIRST_ONLY = 1,
  ANY = 2
}

@Injectable()
export class CfOrgSpaceDataService {
  private static CfOrgSpaceServicePaginationKey = 'endpointOrgSpaceService';

  public cf: CfOrgSpaceItem<EndpointModel>;
  public org: CfOrgSpaceItem<IOrganization>;
  public space: CfOrgSpaceItem<ISpace>;

  public paginationAction = new GetAllOrganizations(CfOrgSpaceDataService.CfOrgSpaceServicePaginationKey, null, [
    createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
  ]);

  private allOrgs$ = getPaginationObservables<APIResource<IOrganization>>({
    store: this.store,
    action: this.paginationAction,
    paginationMonitor: this.paginationMonitorFactory.create(
      this.paginationAction.paginationKey,
      entityFactory(this.paginationAction.entityKey)
    )
  });

  private getEndpointsAndOrgs$: Observable<any>;
  private selectMode = CfOrgSpaceSelectMode.FIRST_ONLY;

  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    @Optional() private _selectMode: CfOrgSpaceSelectMode
  ) {
    // Note - optional parameter notation' won't work with injectable
    this.selectMode = _selectMode || this.selectMode;
    this.createCf();
    this.init();
    this.createOrg();
    this.createSpace();

    const orgResetSub = this.cf.select.asObservable().pipe(
      distinctUntilChanged(),
      withLatestFrom(this.org.list$),
      tap(([selectedCF, orgs]) => {
        if (
          !!orgs.length &&
          ((this.selectMode === CfOrgSpaceSelectMode.FIRST_ONLY && orgs.length === 1) ||
            (this.selectMode === CfOrgSpaceSelectMode.ANY))
        ) {
          this.org.select.next(orgs[0].guid);
        } else {
          this.org.select.next(undefined);
          this.space.select.next(undefined);
        }
      }),
    ).subscribe();
    this.cf.select.asObservable().finally(() => {
      orgResetSub.unsubscribe();
    });

    const spaceResetSub = this.org.select.asObservable().pipe(
      distinctUntilChanged(),
      withLatestFrom(this.space.list$),
      tap(([selectedOrg, spaces]) => {
        if (
          !!spaces.length &&
          ((this.selectMode === CfOrgSpaceSelectMode.FIRST_ONLY && spaces.length === 1) ||
            (this.selectMode === CfOrgSpaceSelectMode.ANY))
        ) {
          this.space.select.next(spaces[0].guid);
        } else {
          this.space.select.next(undefined);
        }
      })
    ).subscribe();
    this.org.select.asObservable().finally(() => {
      spaceResetSub.unsubscribe();
    });
  }

  private init() {
    this.getEndpointsAndOrgs$ = Observable.combineLatest(
      this.allOrgs$.pagination$
        .filter(paginationEntity => {
          return !getCurrentPageRequestInfo(paginationEntity).busy;
        })
        .first(),
      this.cf.list$
    );
  }

  private createCf() {
    this.cf = {
      list$: this.store
        .select(endpointsRegisteredEntitiesSelector)
        .first()
        .map(endpoints => Object.values(endpoints)),
      loading$: Observable.of(false),
      select: new BehaviorSubject(undefined)
    };
  }

  private createOrg() {
    const orgList$ = Observable.combineLatest(
      this.cf.select.asObservable(),
      this.getEndpointsAndOrgs$,
      this.allOrgs$.entities$
    ).map(
      ([selectedCF, endpointsAndOrgs, entities]: [string, any, APIResource<IOrganization>[]]) => {
        const [pag, cfList] = endpointsAndOrgs;
        if (selectedCF && entities) {
          return entities
            .map(org => org.entity)
            .filter(org => org.cfGuid === selectedCF);
        }
        return [];
      }
    );

    this.org = {
      list$: orgList$,
      loading$: this.allOrgs$.pagination$.map(
        pag => getCurrentPageRequestInfo(pag).busy
      ),
      select: new BehaviorSubject(undefined)
    };
  }
  private createSpace() {
    const spaceList$ = Observable.combineLatest(
      this.org.select.asObservable(),
      this.getEndpointsAndOrgs$,
      this.allOrgs$.entities$
    ).map(([selectedOrgGuid, data, orgs]) => {
      const [orgList, cfList] = data;
      const selectedOrg = orgs.find(org => {
        return org.metadata.guid === selectedOrgGuid;
      });
      if (selectedOrg && selectedOrg.entity && selectedOrg.entity.spaces) {
        return selectedOrg.entity.spaces.map(space => {
          const entity = { ...space.entity };
          entity.guid = space.metadata.guid;
          return entity;
        });
      }
      return [];
    });

    this.space = {
      list$: spaceList$,
      loading$: this.org.loading$,
      select: new BehaviorSubject(undefined)
    };
  }

  public getEndpointOrgs(endpointGuid: string) {
    return this.allOrgs$.entities$.pipe(
      map(orgs => {
        return orgs.filter(o => o.entity.cfGuid === endpointGuid);
      })
    );
  }
}
