import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.scss']
})
export class ProfileDialogComponent implements OnInit {
  public isOpen: boolean;
  public user: any;

  constructor(public auth: AuthService) { 
    this.isOpen = true;
    this.user = this.auth.user()
  }

  ngOnInit(): void {
  }

  open(){
    this.isOpen = true;
  }

  close(){
    this.isOpen = false;
  }

}
