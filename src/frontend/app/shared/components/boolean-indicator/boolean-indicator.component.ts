import { Component, OnInit, Input } from '@angular/core';
import { split } from 'ts-node/dist';

export enum BooleanIndicatorType {
  enabledDisabled = 'enabledDisabled',
  lockedUnlocked = 'lockedUnlocked',
  unlockedLocked = 'unlockedLocked',
  yesNo = 'yesNo',
  trueFalse = 'trueFalse'
}


@Component({
  selector: 'app-boolean-indicator',
  templateUrl: './boolean-indicator.component.html',
  styleUrls: ['./boolean-indicator.component.scss']
})
export class BooleanIndicatorComponent implements OnInit {

  @Input('isTrue') isTrue: boolean;
  @Input('type') type: BooleanIndicatorType;

  private icons = {
    Yes: 'check',
    Enabled: 'check_circle',
    True: 'check_circle',
    No: 'close',
    Disabled: 'block',
    False: 'block',
    Locked: 'lock_outline',
    Unlocked: 'lock_open',
  };
  constructor() { }

  ngOnInit() {
  }

  getIcon = () => {
    return this.icons[this.getText()];
  }

  getText = (): string => {
    const [enabledText, disabledText] = this.splitCamelCaseToString(this.type);
    return this.isTrue ? enabledText : disabledText;
  }

  splitCamelCaseToString = (s) => s.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).split(' ');

}
