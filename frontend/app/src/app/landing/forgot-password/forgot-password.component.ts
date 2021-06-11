import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  public submitted: boolean;
  public failed: boolean;
  public succeded: boolean;
  @Output() modeChange: EventEmitter<string>
  public forgotPasswordGroup: FormGroup;


  constructor(private auth: AuthService, private formBuilder: FormBuilder) { 
    this.modeChange = new EventEmitter();


    this.forgotPasswordGroup = this.formBuilder.group({
			email: [ '', [Validators.email, Validators.required] ],
		});


  }

  ngOnInit(): void {
  }

  public onForgotPassword(){
		this.submitted = true;
		
    if(this.forgotPasswordGroup.valid){
      this.auth.forgotPassword(this.forgotPasswordGroup.controls.email.value).subscribe(({data}) => {
        this.succeded = true;
      },
      (err) => {
        this.failed = true;
      })
    }


	}

}
