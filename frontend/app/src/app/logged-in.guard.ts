import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoggedInGuard implements CanActivate {


  constructor(private auth: AuthService, private router: Router){

  }


  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot):  Promise<boolean | UrlTree>  {

  
      if(await this.auth.isLoggedIn()){
        this.router.navigate(['/rooms']);
        return false;
      }

      return true;
  }
  
}
