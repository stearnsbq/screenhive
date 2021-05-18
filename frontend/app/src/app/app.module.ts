import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GraphQLModule } from './graphql.module';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { HeaderComponent } from './header/header.component';
import { CookieModule } from 'ngx-cookie';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SocketIoModule } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';

@NgModule({
  declarations: [
    AppComponent, LoginComponent, HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    GraphQLModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CookieModule.forRoot(),
    SocketIoModule.forRoot({ url: environment.socket + "?token=" + localStorage.getItem("access_token"), options: {} })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
