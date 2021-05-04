import { LandingRoutingModule } from './landing-routing.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingComponent } from './landing.component';
import {MatIconModule} from '@angular/material/icon';
import { DropdownComponent } from './dropdown/dropdown.component';


@NgModule({
  declarations: [LandingComponent, DropdownComponent],
  imports: [
    CommonModule,
    LandingRoutingModule,
    MatIconModule
  ]
})
export class LandingModule { }
