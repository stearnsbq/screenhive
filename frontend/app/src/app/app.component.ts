import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'screenhive';

  constructor(public auth: AuthService, private api: ApiService, public router: Router){
      this.api.csrf().then()


  }
}
