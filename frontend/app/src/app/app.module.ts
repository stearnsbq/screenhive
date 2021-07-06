import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CookieModule } from 'ngx-cookie';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SocketIoModule } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';
import { APOLLO_OPTIONS } from 'apollo-angular';
import {
  ApolloClientOptions,
  ApolloLink,
  GraphQLRequest,
  InMemoryCache,
} from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';
import { CookieService } from 'ngx-cookie';
import { HeaderModule } from './header/header.module';
import { TokenRefreshInterceptor } from './token-refresh.interceptor';
import { StorageService } from './storage.service';

export function createApollo(
  httpLink: HttpLink,
  cookies: CookieService,
  storage: StorageService
): ApolloClientOptions<any> {
  const basic = setContext((operation, context) => ({
    headers: {
      Accept: 'charset=utf-8',
    },
  }));

  const auth = setContext(async (operation: GraphQLRequest, context) => {
    const token = storage.getItem('access_token');

    return token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  });

  return {
    link: ApolloLink.from([
      basic,
      auth,
      httpLink.create({ uri: environment.api, withCredentials: true }),
    ]),
    cache: new InMemoryCache(),
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HeaderModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CookieModule.forRoot(),
  ],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink, CookieService, StorageService],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
