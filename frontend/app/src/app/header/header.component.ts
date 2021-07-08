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

  public small: boolean;

  constructor(public router: Router, public auth: AuthService) { 
    this.small = false;
    this.isNotificationsOpen = false;
    this.isUserOpen = false;
    this.isHamburgerMenuOpen = false;
    this.user = this.auth.user();
  } 

  ngOnInit(): void {

    this.small = window.innerWidth <= 745

    window.onresize = () => this.small = window.innerWidth <= 745;
    
  }



  home(){
    this.router.navigate(['/rooms'])
  }

}
