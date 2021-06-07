import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  public registerGroup: FormGroup;
  public submitted: boolean;
  @Output() modeChange: EventEmitter<string>
  
  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {

    this.registerGroup = this.formBuilder.group({
			username: [ '', Validators.required ],
			password: [ '', Validators.pattern('^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$') ], // atleast 8 chars, 1 number, 1 character and one special
			email: ['', Validators.email],
			confirmPassword: [''],
			dob: [new Date(), Validators.required ]
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

		const {username, password, confirmPassword, email, dob} = this.registerGroup.controls;

		// if (this.registerGroup.valid) {
		// 	this.authService.register(username.value, password.value, confirmPassword.value, email.value, Date.parse(dob.value)).subscribe(
		// 		({ data }) => {
		// 			this.mode = 'login'
		// 		},
		// 		(err) => {
		// 			this.failed = true;
		// 		}
		// 	);
		// }
	}

}
