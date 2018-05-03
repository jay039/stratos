import { Action } from '@ngrx/store';

import { OrgUserRoleNames } from '../../features/cloud-foundry/cf.helpers';
import {
  UsersRolesActions,
  UsersRolesSetChanges,
  UsersRolesSetOrg,
  UsersRolesSetOrgRole,
  UsersRolesSetSpaceRole,
  UsersRolesSetUsers,
  UsersRolesClear,
} from '../actions/users-roles.actions';
import {
  createUserRoleInOrg,
  createUserRoleInSpace,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
} from '../types/user.types';
import { UsersRolesState } from '../types/users-roles.types';
import { APIResource } from '../types/api.types';
import { ADD_PERMISSION_SUCCESS, REMOVE_PERMISSION_SUCCESS, ChangeUserPermission } from '../actions/users.actions';
import { ISpace } from '../../core/cf-api.types';
import { AppState } from '../app-state';
import { APISuccessOrFailedAction } from '../types/request.types';

export function createDefaultOrgRoles(orgGuid: string): IUserPermissionInOrg {
  return {
    name: '',
    orgGuid: orgGuid,
    permissions: createUserRoleInOrg(
      undefined,
      undefined,
      undefined,
      undefined),
    spaces: {},
  };
}

export function createDefaultSpaceRoles(orgGuid: string, spaceGuid: string): IUserPermissionInSpace {
  return {
    name: '',
    spaceGuid,
    orgGuid,
    permissions: createUserRoleInSpace(
      undefined,
      undefined,
      undefined
    )
  };
}

const defaultState: UsersRolesState = {
  cfGuid: '',
  users: [],
  newRoles: createDefaultOrgRoles(''),
  changedRoles: []
};

export function UsersRolesReducer(state: UsersRolesState = defaultState, action: Action): UsersRolesState {
  switch (action.type) {
    case UsersRolesActions.SetUsers:
      const setUsersAction = action as UsersRolesSetUsers;
      return {
        ...state,
        cfGuid: setUsersAction.cfGuid,
        users: setUsersAction.users,
        // Clear all roles but retain the selected org
        newRoles: createDefaultOrgRoles(state.newRoles ? state.newRoles.orgGuid : '')
      };
    case UsersRolesActions.Clear:
      return defaultState;
    case UsersRolesActions.SetOrg:
      const setOrgAction = action as UsersRolesSetOrg;
      return {
        ...state,
        newRoles: createDefaultOrgRoles(setOrgAction.selectedOrg)
      };
    case UsersRolesActions.SetOrgRole:
      const setOrgRoleAction = action as UsersRolesSetOrgRole;
      return setRole(state, setOrgRoleAction.orgGuid, null, setOrgRoleAction.role, setOrgRoleAction.setRole);
    case UsersRolesActions.SetSpaceRole:
      const setSpaceRoleAction = action as UsersRolesSetSpaceRole;
      return setRole(state, setSpaceRoleAction.orgGuid, setSpaceRoleAction.spaceGuid, setSpaceRoleAction.role, setSpaceRoleAction.setRole);
    case UsersRolesActions.SetChanges:
      const setChangesAction = action as UsersRolesSetChanges;
      return {
        ...state,
        changedRoles: setChangesAction.changes
      };
  }
  return state;
}

function setPermission(roles: IUserPermissionInOrg | IUserPermissionInSpace, role: string, setRole: boolean) {
  if (roles.permissions[role] === setRole) {
    return false;
  }
  roles.permissions = {
    ...roles.permissions,
    [role]: setRole
  };
  return true;
}

function setRole(existingState: UsersRolesState, orgGuid: string, spaceGuid: string, role: string, setRole: boolean): UsersRolesState {
  const existingOrgRoles = existingState.newRoles;
  let newOrgRoles = existingOrgRoles ? {
    ...existingOrgRoles,
    spaces: {
      ...existingOrgRoles.spaces
    }
  } : createDefaultOrgRoles(orgGuid);

  if (spaceGuid) {
    if (!newOrgRoles.spaces[spaceGuid]) {
      newOrgRoles.spaces[spaceGuid] = createDefaultSpaceRoles(orgGuid, spaceGuid);
    }
    const spaceRoles = newOrgRoles.spaces[spaceGuid] = {
      ...newOrgRoles.spaces[spaceGuid]
    };
    newOrgRoles = setPermission(spaceRoles, role, setRole) ? newOrgRoles : null;
    // If the user has applied any space role they must also have the org user role applied too.
    if (newOrgRoles && setRole) {
      newOrgRoles.permissions = {
        ...newOrgRoles.permissions,
        [OrgUserRoleNames.USER]: true
      };
    }
  } else {
    newOrgRoles = setPermission(newOrgRoles, role, setRole) ? newOrgRoles : null;
    // If the user has applied the org manager, auditor or billing manager role they must also have the org user role applied too.
    if (newOrgRoles && role !== 'user' && setRole) {
      newOrgRoles.permissions = {
        ...newOrgRoles.permissions,
        [OrgUserRoleNames.USER]: true
      };
    }
  }

  if (newOrgRoles) {
    return {
      ...existingState,
      newRoles: {
        ...existingState.newRoles,
        ...newOrgRoles,
      }
    };
  }

  return existingState;
}

interface StateEntities<T> { [guid: string]: APIResource<T>; }

export function changeOrgSpacePermissions<T extends object>(isSpace: boolean) {
  return function (state: StateEntities<T>, action: APISuccessOrFailedAction) {
    const permAction = action.apiAction as ChangeUserPermission;
    switch (action.type) {
      case ADD_PERMISSION_SUCCESS:
      case REMOVE_PERMISSION_SUCCESS:
        const isAdd = action.type === ADD_PERMISSION_SUCCESS ? true : false;
        return (isSpace && !!permAction.isSpace) || (!isSpace && !permAction.isSpace) ? newEntityState<T>(state, permAction, isAdd) : state;
    }
    return state;
  };
}

function newEntityState<T extends object>(state: StateEntities<T>, action: ChangeUserPermission, add: boolean): StateEntities<T> {
  const apiResource: APIResource<T> = state[action.guid];
  if (!apiResource) {
    return state;
  }
  let roles: string[] = apiResource.entity[action.permissionTypeKey];
  if (!roles) {
    return state;
  }
  const index = roles.findIndex(guid => guid === action.userGuid);
  if (add) {
    // Add the user t othe role... but only if it doesn't exist already
    if (index >= 0) {
      return state;
    }
    roles = [
      ...roles,
      action.userGuid
    ];
  } else {
    // Remove the user from the role... but only if it exists already
    if (index >= 0) {
      roles = [...roles];
      roles.splice(index, 1);
    }
  }
  return {
    ...state,
    [action.guid]: {
      ...apiResource,
      entity: Object.assign({}, apiResource.entity, {
        [action.permissionTypeKey]: roles
      })
    }
  };
}