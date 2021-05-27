import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { ProfileDialogComponent } from './profile-dialog/profile-dialog.component';



@NgModule({
  declarations: [HeaderComponent, DropdownComponent, ProfileDialogComponent],
  exports: [HeaderComponent],
  imports: [
    CommonModule
  ]
})
export class HeaderModule { }
