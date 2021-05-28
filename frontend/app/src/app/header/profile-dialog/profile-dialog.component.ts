import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/api.service';
import { AuthService } from 'src/app/auth.service';


enum Section{
  Account = 0, 
  Billing = 1, 
}



@Component({
  selector: 'app-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.scss']
})
export class ProfileDialogComponent implements OnInit {
  public isOpen: boolean;
  public user: any;
  public section: Section; 
  public Section = Section


  constructor(public api : ApiService) { 
    this.section = Section.Account;
    this.isOpen = true;
  }

  ngOnInit(): void {
    this.api.UserInfo().subscribe(({data} : any) => {

      this.user = data.user;

    })
  }

  open(){
    this.isOpen = true;
  }

  close(){
    this.isOpen = false;
  }

  censorEmail(email: string){
    return email.replace(/.+?(?=@)/g, (val: string) => {
      return "*".repeat(val.length);
    })
  }
 
}
