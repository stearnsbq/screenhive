import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileDialogComponent } from './profile-dialog/profile-dialog.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @ViewChild("profile") profile: ProfileDialogComponent
  public isMessagesOpen: boolean;
  public isNotificationsOpen: boolean;

  constructor(public router: Router) { 
    this.isMessagesOpen = false;
    this.isNotificationsOpen = false;
  } 

  ngOnInit(): void {
  }


  public showSearch(){
    return !this.router.url.includes("/room")
  }

  home(){
    this.router.navigate(['/rooms'])
  }

}
