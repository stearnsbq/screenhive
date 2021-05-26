import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

@Component({
  selector: 'app-password-dialog',
  templateUrl: './password-dialog.component.html',
  styleUrls: ['./password-dialog.component.scss']
})
export class PasswordDialogComponent implements OnInit {
  public isOpen: boolean;
  private passwordSubject: Subject<string>;
  public invalid: boolean;

  constructor() { 
    this.isOpen = false;
    this.invalid = false;
    this.passwordSubject = new Subject();
  }

  ngOnInit(): void {
  }


  error({err}){
    switch(err){
      case 'Invalid Password!':{
        this.invalid = true;
      }
    }
  }


  close(){
    this.isOpen = false;
  }

  open(){
    this.isOpen = true;
    return this.passwordSubject.pipe(take(5), finalize(() => console.log("crack")));
  }

  tryJoin(password: string){
    this.passwordSubject.next(password)
  }

}
