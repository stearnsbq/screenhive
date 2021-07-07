import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProfileDialogComponent } from './profile-dialog/profile-dialog.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @ViewChild("profile") profile: ProfileDialogComponent
  public isNotificationsOpen: boolean;
  public isUserOpen: boolean;
  public isHamburgerMenuOpen: boolean;
  public user: any;

  constructor(public router: Router, public auth: AuthService) { 
    this.isNotificationsOpen = false;
    this.isUserOpen = false;
    this.isHamburgerMenuOpen = false;
    this.user = this.auth.user();
  } 

  ngOnInit(): void {
    
  }



  home(){
    this.router.navigate(['/rooms'])
  }

}
