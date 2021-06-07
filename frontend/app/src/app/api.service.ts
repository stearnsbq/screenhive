import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private apollo: Apollo) { }



  public csrf(){

    return fetch(environment.csrf)

  }


  public checkIfUserNameExists(username: string){
    const query = gql`
    mutation CheckIfUserExists($username: String!) {
      checkIfUserExists(username: $username)
    }
  `;


  return this.apollo.query({
    query,
    variables:{
      username
    }
  })

  }


  public UserInfo(){
    const query = gql`
    query {
      user{
        username
        email
        dob
        registered
        verified
        discriminator
      }
    }
  `;
  return this.apollo.query({
    query
  });
  }



}
