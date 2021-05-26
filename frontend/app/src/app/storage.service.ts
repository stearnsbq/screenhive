import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private _roomPassword: string;
  private _token: string;

  constructor() { 
  }

  get token(): string{
    this.sync();
    return this._token;
  }

  set token(token: string){
    this.save();
    this._token = token;
  }

  get roomPassword(): string{
    this.sync();
    return this._roomPassword;
  }

  set roomPassword(password: string){
    this._roomPassword = password;
    this.save();
  }


  public sync(){
    this._roomPassword = localStorage.getItem("roomPassword")
    this._token = localStorage.getItem("access_token")
  }

  private save(){
    localStorage.setItem("roomPassword", this._roomPassword);
    localStorage.setItem("access_token", this._token);
  }


}
