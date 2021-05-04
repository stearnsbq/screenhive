import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainAppRoutingModule } from './main-app-routing.module';
import { MainAppComponent } from './main-app.component';
import { LoginComponent } from './login/login.component';


@NgModule({
  declarations: [MainAppComponent, LoginComponent],
  imports: [
    CommonModule,
    MainAppRoutingModule
  ]
})
export class MainAppModule { }
