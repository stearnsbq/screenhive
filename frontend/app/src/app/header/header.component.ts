import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
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

}
