import { Resolver, Query, Mutation, Arg, Ctx, ResolverInterface } from 'type-graphql';
import argon2 from 'argon2';
import jsonwebtoken from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { Service } from 'typedi';

@Service()
@Resolver()
export class LoginResolver {
	constructor(private userService: UserService) {}

	@Mutation(() => String)
	async login(@Arg('username') username: string, @Arg('password') password: string, @Ctx() ctx: any) {
		const res = ctx.res;

		const user = await this.userService.getUser({ username });

		if (user && (await argon2.verify(user.password, password))) {
			res.cookie(
				'refresh_token',
				jsonwebtoken.sign({}, process.env.JWT_SECRET as string, {
					expiresIn: '7d',
					issuer: 'screenhive.io',
					audience: 'screenhive_users',
					algorithm: 'HS256'
				}),
				{ maxAge: 604800, httpOnly: true }
			);

			user.lastLogin = new Date();

			user.save();

			return jsonwebtoken.sign({ id: user.id }, process.env.JWT_SECRET as string, {
				expiresIn: '15m',
				issuer: 'screenhive.io',
				audience: 'screenhive_users'
			});
		}

		ctx.res.status(401);
		throw new Error('Invalid Username or Password');
	}
}
