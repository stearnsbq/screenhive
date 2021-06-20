import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private jwtHelper: JwtHelperService;
  public loggedIn: boolean;

  constructor(
    private apollo: Apollo,
    private router: Router,
    private storage: StorageService
  ) {
    this.jwtHelper = new JwtHelperService();
  }

  public user() {
    return this.jwtHelper.decodeToken(this.storage.getItem('access_token'));
  }

  public async isLoggedIn() {

    if (!this.jwtHelper.isTokenExpired(this.storage.getItem('access_token'))) {
      this.loggedIn = true;
      return this.loggedIn;
    }

    // try to refresh our token!

    try {
      const { data } = (await this.refreshToken().toPromise()) as any;

      this.storage.setItem('access_token', data.refreshToken);

      return true;
    } catch (err) {
      console.log(err);
    }

    return false;
  }

  public register(
    username: string,
    password: string,
    confirmPassword: string,
    email: string,
    dob: number,
    captcha: string,
  ) {
    const mutation = gql`
      mutation Register(
        $username: String!
        $password: String!
        $confirmPassword: String!
        $email: String!
        $dob: Float!
        $captcha: String!
      ) {
        register(
          username: $username
          password: $password
          email: $email
          dob: $dob
          confirmPassword: $confirmPassword
          captcha: $captcha
        )
      }
    `;

    return this.apollo.mutate({
      mutation,
      variables: {
        username,
        password,
        email,
        dob,
        confirmPassword,
        captcha
      },
    });
  }

  public logout() {
    const mutation = gql`
      mutation {
        logout
      }
    `;

    this.apollo.mutate({ mutation }).subscribe(
      () => {
        this.storage.clear();

        this.apollo.client.resetStore();

        this.loggedIn = false;

        this.router.navigate(['']);
      },
      (err) => {
        console.log(err);
      }
    );
  }

  public login(username: string, password: string) {
    if (this.loggedIn) {
      throw new Error('Already logged in!');
    }

    const mutation = gql`
      mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password)
      }
    `;

    return this.apollo
      .mutate({
        mutation,
        variables: {
          username,
          password,
        },
      })
      .pipe(
        tap(({ data }) => {
          this.storage.setItem('access_token', data['login']);
        })
      );
  }

  public refreshToken() {
    const query = gql`
      query {
        refreshToken
      }
    `;
    return this.apollo.query({
      query,
    });
  }


  public forgotPassword(email: string, captcha: string){

    const query = gql`
    query resetPasswordRequest($email: String!, $captcha: String!){
      resetPasswordRequest(email: $email, captcha: $captcha)
    }
    `

    return this.apollo.query({
      query,
      variables:{
        email,
        captcha
      }
    })

  }

}
