import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private ApiService: ApiService, private authService: AuthService) { }

  ngOnInit(): void {
  }


  public onLogin(username, password){

    this.authService.login(username, password).subscribe(({data}) => {
      console.log(data)
    })


  }

}
