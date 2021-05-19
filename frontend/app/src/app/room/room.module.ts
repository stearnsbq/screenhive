import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RoomRoutingModule } from './room-routing.module';
import { RoomComponent } from './room.component';

import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [RoomComponent],
  imports: [
    CommonModule,
    FormsModule,
    RoomRoutingModule
  ]
})
export class RoomModule { }
