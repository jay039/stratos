import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataItemComponent } from './metadata-item.component';
import { CoreModule } from '../../../core/core.module';

describe('MetadataItemComponent', () => {
  let component: MetadataItemComponent;
  let fixture: ComponentFixture<MetadataItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        MetadataItemComponent
      ],
      imports: [
        CoreModule
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetadataItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
