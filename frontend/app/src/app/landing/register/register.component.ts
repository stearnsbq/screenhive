import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth.service';
import { LoadingService } from 'src/app/loading.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  public registerGroup: FormGroup;
  public submitted: boolean;
  public failed: boolean;
  @Output() modeChange: EventEmitter<string>
  
  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router, private loadingService : LoadingService) {

    this.registerGroup = this.formBuilder.group({
			username: [ '', Validators.required ],
			password: [ '', [Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$'), Validators.required]  ], // atleast 8 chars, 1 number, 1 character and one special
			email: ['', [Validators.required, Validators.email]],
			confirmPassword: ['', Validators.required],
			dob: ['', [Validators.required, Validators.pattern('(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1])\/[0-9]{4}')] ], // date format
			captcha: ['', Validators.required]
		},{validators: this.checkIfPasswordsMatch});

    this.modeChange = new EventEmitter()
   }

  ngOnInit(): void {
  }

  private checkIfPasswordsMatch(group: AbstractControl){
	const password = group.get('password').value;
	const confirmPassword = group.get('confirmPassword').value;
  
	return password === confirmPassword ? null : { notSame: true }     
	}

  public onRegister(){
		this.submitted = true;
		this.loadingService.loading = true;

		const {username, password, confirmPassword, email, dob, captcha} = this.registerGroup.controls;

		console.log(username.value, password.value, confirmPassword.value, email.value, dob.value, captcha.value)

		if (this.registerGroup.valid) {
			this.authService.register(username.value, password.value, confirmPassword.value, email.value, Date.parse(dob.value), captcha.value).subscribe(
				({ data }) => {
					this.modeChange.emit('login')
				},
				(err) => {
					this.failed = true;
				},
				() => {
					this.loadingService.loading = false;
				}
			);
		}
	}

}
