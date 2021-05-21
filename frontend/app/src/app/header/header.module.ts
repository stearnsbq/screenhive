import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header.component';
import { DropdownComponent } from './dropdown/dropdown.component';



@NgModule({
  declarations: [HeaderComponent, DropdownComponent],
  exports: [HeaderComponent],
  imports: [
    CommonModule
  ]
})
export class HeaderModule { }
