import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private _access_token: string;

  constructor() { }


  get access_token(): string{
    return this._access_token;
  }

  set access_token(token: string){
    this._access_token = token;
  }


}
