import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/api.service';
import { AuthService } from 'src/app/auth.service';


enum Section{
  Account = 0, 
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
    this.isOpen = false;
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

  uploadAvatar(file){
    this.api.uploadAvatar(file).subscribe(({data} : any) => {
      location.reload()
    })
  }

  censorEmail(email: string){
    return email.replace(/.+?(?=@)/g, (val: string) => {
      return "*".repeat(val.length);
    })
  }
 
}
