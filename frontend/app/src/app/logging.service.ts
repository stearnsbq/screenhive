import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  constructor() { }

  private format(message){
    return [`[%cScreen%cHive%c] ${message}`, "color:#ff8200;", "color:#4ea699;", "color:default;"];
  }


  public debug(message){
    console.debug(...this.format(message))
  }

  public error(message){
    console.error(...this.format(message))
  }



}
