import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerifyComponent } from './verify.component';
import { VerifyRoutingModule } from './routing.module';



@NgModule({
  declarations: [VerifyComponent],
  imports: [
    CommonModule,
    VerifyRoutingModule
  ]
})
export class VerifyModule { }
