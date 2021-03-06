import { RequestOptions } from '@angular/http';

import {
  cfUserSchemaKey,
  endpointSchemaKey,
  entityFactory,
  EntitySchema,
  organizationSchemaKey,
  spaceSchemaKey,
} from '../helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../helpers/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, IRequestAction } from '../types/request.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../types/user.types';
import { getActions } from './action.helper';

export const GET_ALL = '[Users] Get all';
export const GET_ALL_SUCCESS = '[Users] Get all success';
export const GET_ALL_FAILED = '[Users] Get all failed';

export const REMOVE_ROLE = '[Users] Remove role';
export const REMOVE_ROLE_SUCCESS = '[Users]  Remove role success';
export const REMOVE_ROLE_FAILED = '[Users]  Remove role failed';

export const ADD_ROLE = '[Users] Add role';
export const ADD_ROLE_SUCCESS = '[Users]  Add role success';
export const ADD_ROLE_FAILED = '[Users]  Add role failed';

const defaultUserRelations = [
  createEntityRelationKey(cfUserSchemaKey, organizationSchemaKey),
  createEntityRelationKey(cfUserSchemaKey, 'audited_organizations'),
  createEntityRelationKey(cfUserSchemaKey, 'managed_organizations'),
  createEntityRelationKey(cfUserSchemaKey, 'billing_managed_organizations'),
  createEntityRelationKey(cfUserSchemaKey, spaceSchemaKey),
  createEntityRelationKey(cfUserSchemaKey, 'managed_spaces'),
  createEntityRelationKey(cfUserSchemaKey, 'audited_spaces')
];
export const GET_CF_USER = '[Users] Get cf user ';
export const GET_CF_USER_SUCCESS = '[Users] Get cf user success';
export const GET_CF_USER_FAILED = '[Users] Get cf user failed';

export const GET_CF_USERS_BY_ORG = '[Users] Get cf users by org ';

const createGetAllUsersPaginationKey = cfGuid => createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
const createGetAllUsersInitialParams = () => ({
  page: 1,
  'results-per-page': 100,
  'order-direction': 'desc',
  'order-direction-field': 'username',
});

export class GetAllUsersAsNonAdmin implements PaginatedAction {
  type = GET_CF_USERS_BY_ORG;
  paginationKey: string;
  actions: string[] = [];
  entityKey = cfUserSchemaKey;
  constructor(
    public cfGuid: string,
    public includeRelations: string[] = defaultUserRelations,
    public populateMissing = true
  ) {
    this.paginationKey = createGetAllUsersPaginationKey(cfGuid);
  }
  initialParams = createGetAllUsersInitialParams();
}

export class GetAllUsersAsAdmin extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  paginationKey: string;
  constructor(
    public endpointGuid: string,
    public includeRelations: string[] = defaultUserRelations,
    public populateMissing = true) {
    super();
    this.paginationKey = createGetAllUsersPaginationKey(endpointGuid);
    this.options = new RequestOptions();
    this.options.url = 'users';
    this.options.method = 'get';
  }
  actions = [GET_ALL, GET_ALL_SUCCESS, GET_ALL_FAILED];
  entity = [entityFactory(cfUserSchemaKey)];
  entityKey = cfUserSchemaKey;
  options: RequestOptions;
  initialParams = createGetAllUsersInitialParams();
  flattenPagination = true;
}

export class GetCFUser extends CFStartAction implements IRequestAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `users/${guid}/summary`;
    this.options.method = 'get';
  }
  actions = [GET_CF_USER, GET_CF_USER_SUCCESS, GET_CF_USER_FAILED];
  entity = entityFactory(cfUserSchemaKey);
  entityKey = cfUserSchemaKey;
  options: RequestOptions;
}

export class ChangeUserRole extends CFStartAction implements IRequestAction {
  constructor(
    public endpointGuid: string,
    public userGuid: string,
    public method: string,
    public actions: string[],
    public permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    public entityGuid: string,
    public isSpace = false,
    public updateConnectedUser = false,
    public orgGuid?: string
  ) {
    super();
    this.guid = entityGuid;
    this.updatingKey = ChangeUserRole.generateUpdatingKey(permissionTypeKey, userGuid);
    this.options = new RequestOptions();
    this.options.url = `${isSpace ? 'spaces' : 'organizations'}/${this.guid}/${this.updatingKey}`;
    this.options.method = method;
    this.entityKey = isSpace ? spaceSchemaKey : organizationSchemaKey;
    this.entity = entityFactory(this.entityKey);
  }

  guid: string;
  entity: EntitySchema;
  entityKey: string;
  options: RequestOptions;
  updatingKey: string;

  static generateUpdatingKey<T>(permissionType: OrgUserRoleNames | SpaceUserRoleNames, userGuid: string) {
    return `${permissionType}/${userGuid}`;
  }
}

export class AddUserRole extends ChangeUserRole {
  constructor(
    endpointGuid: string,
    userGuid: string,
    entityGuid: string,
    permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    isSpace = false,
    updateConnectedUser = false,
    orgGuid?: string
  ) {
    super(
      endpointGuid,
      userGuid,
      'put',
      [ADD_ROLE, ADD_ROLE_SUCCESS, ADD_ROLE_FAILED],
      permissionTypeKey,
      entityGuid,
      isSpace,
      updateConnectedUser,
      orgGuid
    );
  }
}

export class RemoveUserRole extends ChangeUserRole {
  constructor(
    endpointGuid: string,
    userGuid: string,
    entityGuid: string,
    permissionTypeKey: OrgUserRoleNames | SpaceUserRoleNames,
    isSpace = false,
    updateConnectedUser = false,
    orgGuid?: string
  ) {
    super(
      endpointGuid,
      userGuid,
      'delete',
      [REMOVE_ROLE, REMOVE_ROLE_SUCCESS, REMOVE_ROLE_FAILED],
      permissionTypeKey,
      entityGuid,
      isSpace,
      updateConnectedUser,
      orgGuid
    );
  }
}

export class GetUser extends CFStartAction {
  constructor(
    public endpointGuid: string,
    public userGuid: string,
    public includeRelations: string[] = defaultUserRelations,
    public populateMissing = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'users/' + userGuid;
    this.options.method = 'get';
  }
  actions = getActions('Users', 'Fetch User');
  entity = [entityFactory(cfUserSchemaKey)];
  entityKey = cfUserSchemaKey;
  options: RequestOptions;
}


