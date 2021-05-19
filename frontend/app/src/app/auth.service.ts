import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private refreshTimer: any;
	private jwtHelper: JwtHelperService;

	constructor(private apollo: Apollo, private router: Router) {
		this.jwtHelper = new JwtHelperService();
	}

	public user(){
		const token = localStorage.getItem("access_token");
		return this.jwtHelper.decodeToken(token);
	}


	public isLoggedIn() {
		const token = localStorage.getItem("access_token");
		return !this.jwtHelper.isTokenExpired(token);
	}

	public logout() {
		const mutation = gql`
			mutation {
				logout
			}
		`;

		this.apollo.mutate({ mutation }).subscribe(
			() => {
				localStorage.clear();

				this.apollo.client.resetStore();

				clearTimeout(this.refreshTimer);
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
					localStorage.setItem("access_token", data["login"])
					this.startRefreshTimer();
				})
			);
	}

	public startRefreshTimer() {
		const helper = new JwtHelperService();

		const user = helper.decodeToken(localStorage.getItem("access_token")) as any;

		const expires = new Date(user.exp * 1000);
		const timeout = expires.getTime() - Date.now() - 60 * 1000;

		this.refreshTimer = setTimeout(() => {
			this.refreshToken().subscribe(
				({ data }) => {
					const token = data['refreshToken'];
					console.log(`Token Refresh ${token}`);

					localStorage.setItem("access_token", token);
				},
				(err) => {
					console.log(err); // refresh token died
				}
			);
		}, timeout);
	}

	public refreshToken() {
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
