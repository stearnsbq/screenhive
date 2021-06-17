import { convertUpdateArguments } from '@angular/compiler/src/compiler_util/expression_converter';
import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoggingService } from 'src/app/logging.service';
import { StorageService } from 'src/app/storage.service';
import { WebsocketService } from 'src/app/websocket.service';

@Component({
  selector: 'app-creation-dialog',
  templateUrl: './creation-dialog.component.html',
  styleUrls: ['./creation-dialog.component.scss']
})
export class CreationDialogComponent implements OnInit {
  public isPrivate: boolean;
  public isOpen: boolean;
  public creationGroup: FormGroup;



  constructor(private formBuilder: FormBuilder, private websocketService: WebsocketService, private router: Router, private logging: LoggingService, private storage: StorageService) { 
    this.isOpen = false;
    this.isPrivate = false;
    this.creationGroup = this.formBuilder.group({
			name: [ '', Validators.maxLength(50) ],
      private: [false],
			password: [ {value: null, disabled: true} ]
		});


    this.creationGroup.get('private').valueChanges.subscribe(val => {

      const control = this.creationGroup.controls['password'];


      if(this.creationGroup.get('private').value){
        control.enable();
        control.setValidators([Validators.required])
      }else{
        control.disable();
        control.clearValidators()
      }

      control.updateValueAndValidity();
    })


  }

  ngOnInit(): void {
  }

  @HostListener('document:keydown.escape', ['$event'])
  close(){
    this.isOpen = false;
  }

  open(){
    this.isOpen = true;
  }

  onCreate(){
    const controls = this.creationGroup.controls;

    const name = controls['name'].value;
    const password = controls['password'].value;

    this.websocketService.createRoom(name, password).then(({roomID}) => {
        this.storage.setItem("roomPassword", password)

        this.router.navigate(['/room', roomID])
    }, (err) => {
        this.logging.error(JSON.stringify(err));
    })

  }

}
