import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private apollo: Apollo) {}

  public csrf() {
    return fetch(environment.csrf);
  }

  public uploadAvatar(file: File){
    const mutation = gql`
      mutation uploadAvatar($avatar: Upload!){ 
        uploadAvatar(avatar: $avatar)
      }
    `;

    return this.apollo.mutate({
      mutation,
      variables: {
        avatar: file,
      },
      context:{
        useMultipart: true
      }
    });

  }

  public checkIfUserNameExists(username: string) {
    const mutation = gql`
      mutation CheckIfUserExists($username: String!) {
        checkIfUserExists(username: $username)
      }
    `;

    return this.apollo.mutate({
      mutation,
      variables: {
        username,
      },
    });
  }

  public UserInfo() {
    const query = gql`
      query {
        user {
          username
          email
          dob
          registered
          verified
        }
      }
    `;
    return this.apollo.query({
      query,
    });
  }
}
