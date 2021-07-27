import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private _loading: boolean;

  constructor() { 
    this._loading = false;
  }

  public isLoading(): boolean {
    return this._loading;
  }

  public set loading(value: boolean) {
    this._loading = value;
  }


}
