import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  private _searchSubject: Subject<string>;

  constructor() { 
    this._searchSubject = new Subject()
  }

  public get searchSubject(): Subject<string> {
    return this._searchSubject;
  }

}
