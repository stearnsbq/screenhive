import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RoomsRoutingModule } from './rooms-routing.module';
import { RoomsComponent } from './rooms.component';
import { CreationDialogComponent } from './creation-dialog/creation-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddFriendDialogComponent } from './add-friend-dialog/add-friend-dialog.component';
import { DiscriminatorPipe } from './discriminator.pipe';


@NgModule({
  declarations: [RoomsComponent, CreationDialogComponent, AddFriendDialogComponent, DiscriminatorPipe],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RoomsRoutingModule
  ]
})
export class RoomsModule { }
