import { Component, Inject, InjectionToken, Input, OnInit, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ActionHistoryDump } from '../../../store/actions/action-history.actions';
import { AppState } from '../../../store/app-state';

export const SIDENAV_COPYRIGHT = new InjectionToken<string>('Optional copyright string for side nav');

export interface SideNavItem {
  text: string;
  matIcon: string;
  link: string;
  hidden?: Observable<boolean>;
}

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})

export class SideNavComponent implements OnInit {

  constructor(
    private store: Store<AppState>,
    @Optional() @Inject(SIDENAV_COPYRIGHT) private copyright: string) { }

  @Input() tabs: SideNavItem[];
  // Button is not always visible on load, so manually push through an event
  logoClicked: BehaviorSubject<any> = new BehaviorSubject(true);

  ngOnInit() {
    const toLength = a => a.length;
    const debounced$ = this.logoClicked.debounceTime(250); // debounce the click stream
    this.logoClicked
      .buffer(debounced$)
      .map(toLength)
      .filter(x => x === 3)
      .subscribe(event => this.store.dispatch(new ActionHistoryDump()));
  }
}
