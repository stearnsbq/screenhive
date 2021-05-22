import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RoomsRoutingModule } from './rooms-routing.module';
import { RoomsComponent } from './rooms.component';
import { CreationDialogComponent } from './creation-dialog/creation-dialog.component';


@NgModule({
  declarations: [RoomsComponent, CreationDialogComponent],
  imports: [
    CommonModule,
    RoomsRoutingModule
  ]
})
export class RoomsModule { }
