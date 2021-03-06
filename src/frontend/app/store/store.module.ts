import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { EffectsModule } from '@ngrx/effects';

import { ActionHistoryEffect } from './effects/action-history.effects';
import { APIEffect } from './effects/api.effects';
import { AppVariablesEffect } from './effects/app-variables.effects';
import { AuthEffect } from './effects/auth.effects';
import { CloudFoundryEffects } from './effects/cloud-foundry.effects';
import { CreateAppPageEffects } from './effects/create-app-effects';
import { DeployAppEffects } from './effects/deploy-app.effects';
import { EndpointsEffect } from './effects/endpoint.effects';
import { GithubEffects } from './effects/github.effects';
import { MetricsEffect } from './effects/metrics.effects';
import { PaginationEffects } from './effects/pagination.effects';
import { PermissionEffects, PermissionsEffects } from './effects/permissions.effect';
import { RequestEffect } from './effects/request.effects';
import { RouterEffect } from './effects/router.effects';
import { SetClientFilterEffect } from './effects/set-client-filter.effect';
import { SnackBarEffects } from './effects/snackBar.effects';
import { SystemEffects } from './effects/system.effects';
import { UAASetupEffect } from './effects/uaa-setup.effects';
import { UpdateAppEffects } from './effects/update-app-effects';
import { UserProfileEffect } from './effects/user-profile.effects';
import { UsersRolesEffects } from './effects/users-roles.effects';
import { AppReducersModule } from './reducers.module';
import { AppEffects } from './effects/app.effects';
import { UsersEffects } from './effects/users.effects';
import { RecursiveDeleteEffect } from './effects/recursive-entity-delete.effect';

@NgModule({
  imports: [
    AppReducersModule,
    HttpModule,
    HttpClientModule,
    EffectsModule.forRoot([
      APIEffect,
      AuthEffect,
      UAASetupEffect,
      EndpointsEffect,
      CreateAppPageEffects,
      UpdateAppEffects,
      PaginationEffects,
      ActionHistoryEffect,
      AppVariablesEffect,
      RouterEffect,
      SystemEffects,
      SnackBarEffects,
      SetClientFilterEffect,
      DeployAppEffects,
      GithubEffects,
      CloudFoundryEffects,
      MetricsEffect,
      RequestEffect,
      UserProfileEffect,
      UsersRolesEffects,
      PermissionsEffects,
      PermissionEffects,
      UsersEffects,
      RecursiveDeleteEffect,
      AppEffects
    ])
  ]
})
export class AppStoreModule { }
