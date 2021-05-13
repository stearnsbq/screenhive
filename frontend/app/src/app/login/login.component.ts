import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: [ './login.component.scss' ]
})
export class LoginComponent implements OnInit {
	public loginGroup: FormGroup;
	public submitted: boolean;
	public mode: string;
	public failed: boolean;

	constructor(private router: Router, private authService: AuthService, private formBuilder: FormBuilder) {
		this.loginGroup = this.formBuilder.group({
			username: [ '', Validators.required ],
			password: [ '', Validators.required ]
		});
		this.submitted = false;
		this.failed = false;
		this.mode = 'login';
	}

	ngOnInit(): void {}

	get form() {
		return this.loginGroup.controls;
	}

	public changeMode(mode) {
		this.mode = mode;
	}

	public onLogin() {
		this.submitted = true;

		if (this.loginGroup.valid) {
			this.authService.login(this.form.username.value, this.form.password.value).subscribe(
				({ data }) => {
					this.router.navigate(['']);
				},
				(err) => {
					this.failed = true;
				}
			);
		}
	}
}
