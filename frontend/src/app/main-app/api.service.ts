import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private apollo: Apollo, private tokenService: TokenService) { }


  public login(username: string, password: string){

    const mutation = gql`
      mutation Login($username: String!, $password: String!){
          login(username: $username, password: $password)
      }
    `

      return this.apollo.mutate({
        mutation,
        variables:{
          username,
          password
        }
      })

  }


}
