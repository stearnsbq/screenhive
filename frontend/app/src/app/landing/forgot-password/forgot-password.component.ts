import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  public loginGroup: FormGroup;
  public submitted: boolean;
  public failed: boolean;
  @Output() modeChange: EventEmitter<string>
  public forgotPasswordGroup: FormGroup;


  constructor() { }

  ngOnInit(): void {
  }

  public onForgotPassword(){
		this.submitted = true;
		this.failed = false;
	}

}
