import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LandingComponent } from './landing.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LandingRoutingModule } from './landing-routing.module';
import { NgHcaptchaModule } from 'ng-hcaptcha';


@NgModule({
  declarations: [LoginComponent, RegisterComponent, ForgotPasswordComponent, LandingComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LandingRoutingModule,
    NgHcaptchaModule.forRoot({
      siteKey: '07705b25-5cc1-4229-a645-10fd2aaceb01'
  }),
  ]
})
export class LandingModule { }
