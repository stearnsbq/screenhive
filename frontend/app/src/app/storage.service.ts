import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  clear(){
    localStorage.clear();
  }


  getItem(key: string): string | null{
    return localStorage.getItem(key);
  }

  setItem(key: string, val: string){
    localStorage.setItem(key, val);
  }

  removeItem(key: string){
    localStorage.removeItem(key);
  }


  hasItem(key: string){
    return localStorage.getItem(key) !== null;
  }



}
