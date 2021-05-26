import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { StorageService } from './storage.service';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private refreshTimer: any;
	private jwtHelper: JwtHelperService;
	private loggedIn: boolean;

	constructor(private apollo: Apollo, private router: Router, private storage: StorageService) {
		this.jwtHelper = new JwtHelperService();
	}

	public user(){
		return this.jwtHelper.decodeToken(this.storage.token);
	}


	public isLoggedIn() {
		return !this.jwtHelper.isTokenExpired(this.storage.token);
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

		this.refreshTimer = setInterval(() => {
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
