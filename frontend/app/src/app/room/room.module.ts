import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RoomRoutingModule } from './room-routing.module';
import { RoomComponent } from './room.component';

import { FormsModule } from '@angular/forms';
import { PasswordDialogComponent } from './password-dialog/password-dialog.component';


@NgModule({
  declarations: [RoomComponent, PasswordDialogComponent],
  imports: [
    CommonModule,
    FormsModule,
    RoomRoutingModule
  ]
})
export class RoomModule { }
