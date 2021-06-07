import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LandingComponent } from './landing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LandingRoutingModule } from './landing-routing.module';



@NgModule({
  declarations: [LoginComponent, RegisterComponent, ForgotPasswordComponent, LandingComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LandingRoutingModule
  ]
})
export class LandingModule { }
