import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private _access_token: string;
	private refreshTimer: any;
	private jwtHelper: JwtHelperService;

	constructor(private apollo: Apollo, private router: Router) {
		this.jwtHelper = new JwtHelperService();
	}

	get access_token() {
		return this._access_token;
	}

	set access_token(token: string) {
		this._access_token = token;
	}

	public isLoggedIn() {
		return this._access_token && !this.jwtHelper.isTokenExpired(this._access_token);
	}

	public logout() {
		const mutation = gql`
			mutation {
				logout
			}
		`;

		this.apollo.mutate({ mutation }).subscribe(
			() => {
				delete this._access_token;

				this.apollo.client.resetStore();

				clearTimeout(this.refreshTimer);

				localStorage.clear();
			},
			(err) => {
				console.log(err);
			}
		);
	}

	public login(username: string, password: string) {
		if (this.isLoggedIn()) {
			throw new Error('Already logged in!');
		}

		const mutation = gql`
			mutation Login($username: String!, $password: String!) {
				login(username: $username, password: $password)
			}
		`;

		return this.apollo
			.mutate({
				mutation,
				variables: {
					username,
					password
				}
			})
			.pipe(
				tap(({ data }) => {
					this._access_token = data['login'];
					this.startRefreshTimer();
				})
			);
	}

	private startRefreshTimer() {
		const helper = new JwtHelperService();

		const user = helper.decodeToken(this._access_token) as any;

		const expires = new Date(user.exp * 1000);
		const timeout = expires.getTime() - Date.now() - 60 * 1000;

		this.refreshTimer = setTimeout(() => {
			this.refreshToken().subscribe(
				({ data }) => {
					const token = data['refreshToken'];
					console.log(`Token Refresh ${token}`);

					this._access_token = token;
				},
				(err) => {
					console.log(err); // refresh token died
				}
			);
		}, timeout);
	}

	private refreshToken() {
		const query = gql`
			query {
				refreshToken
			}
		`;
		return this.apollo.query({
			query
		});
	}
}
