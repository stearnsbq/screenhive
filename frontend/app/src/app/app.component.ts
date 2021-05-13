import { Component } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'screenhive';

  constructor(public auth: AuthService, private api: ApiService){
      // this.api.csrf().then(() => {
      //   console.log("ok")
      // })
  }
}
