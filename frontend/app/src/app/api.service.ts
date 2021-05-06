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



}
