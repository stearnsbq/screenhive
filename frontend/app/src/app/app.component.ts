import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'screenhive';

  constructor(public auth: AuthService, private api: ApiService, public router: Router, public loading: LoadingService){
      this.api.csrf().then()
  }
}
