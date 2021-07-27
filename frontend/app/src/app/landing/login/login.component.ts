import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth.service';
import { LoadingService } from 'src/app/loading.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public loginGroup: FormGroup;
  public submitted: boolean;
  public failed: boolean;
  @Output() modeChange: EventEmitter<string>

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router, private loadingService: LoadingService) { 

    this.loginGroup = this.formBuilder.group({
			username: [ '', Validators.required ],
			password: [ '', Validators.required ]
		});

    this.modeChange = new EventEmitter();

  }

  ngOnInit(): void {
  }

  public onLogin() {
		this.submitted = true;

		this.loadingService.loading = true;

	
		if (this.loginGroup.valid) {
			this.authService.login(this.loginGroup.controls.username.value, this.loginGroup.controls.password.value).subscribe(
				({ data }) => {
					this.router.navigate(['/rooms']);
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
