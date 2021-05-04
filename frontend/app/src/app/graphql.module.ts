import { NgModule } from '@angular/core';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { ApolloClientOptions, ApolloLink, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { environment } from 'src/environments/environment';
import { setContext } from '@apollo/client/link/context';
import { AuthService } from './auth.service';

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
	const basic = setContext((operation, context) => ({
		headers: {
			Accept: 'charset=utf-8'
		}
	}));

	const auth = setContext(async (operation, context) => {
		const token = localStorage.getItem("access_token")


		return token ? {
			headers: {
				Authorization: `Bearer ${token}`
			}
		} : {}

	});

	return {
		link: ApolloLink.from([ basic, auth, httpLink.create({ uri: environment.api }) ]),
		cache: new InMemoryCache()
	};
}

@NgModule({
	providers: [
		{
			provide: APOLLO_OPTIONS,
			useFactory: createApollo,
			deps: [ HttpLink ]
		}
	]
})
export class GraphQLModule {}
