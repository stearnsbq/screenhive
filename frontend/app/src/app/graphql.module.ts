import { NgModule } from '@angular/core';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { ApolloClientOptions, ApolloLink, GraphQLRequest, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { environment } from 'src/environments/environment';
import { setContext } from '@apollo/client/link/context';
import { CookieService } from 'ngx-cookie';

export function createApollo(httpLink: HttpLink, cookies: CookieService): ApolloClientOptions<any> {
	const basic = setContext((operation, context) => ({
		headers: {
			Accept: 'charset=utf-8'
		}
	}));

	const auth = setContext(async (operation: GraphQLRequest, context) => {
		const token = localStorage.getItem("access_token")

		return token ? {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		} : {}

	});

	return {
		link: ApolloLink.from([ basic, auth, httpLink.create({ uri: environment.api, withCredentials: true }) ]),
		cache: new InMemoryCache()
	};
}

@NgModule({
	providers: [
		{
			provide: APOLLO_OPTIONS,
			useFactory: createApollo,
			deps: [ HttpLink, CookieService ]
		}
	]
})
export class GraphQLModule {}
