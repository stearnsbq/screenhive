import { Resolver, Query, Mutation, Arg, Ctx, ResolverInterface, Authorized } from 'type-graphql';
import argon2 from 'argon2';
import jsonwebtoken from 'jsonwebtoken';
import { Service } from 'typedi';
import { Role } from '../enum/Role';
import { Response } from 'express';
import { Prisma, PrismaClient } from '.prisma/client';

@Service()
@Resolver()
export class LoginResolver {
	constructor() {}

	@Query(() => String)
	async getNewAccessToken(@Ctx() { cookies, res, prisma }: { cookies: any; res: Response; prisma: PrismaClient }) {
		try {
			const token = cookies.refresh_token;

			if ((await prisma.revokedToken.count({ where: { token: token.split('.')[2] } })) > 0) {
				throw new Error('Revoked Token!');
			}

			const refresh_token = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as {
				id: number;
			};

			return jsonwebtoken.sign({ id: refresh_token.id }, process.env.JWT_SECRET as string, {
				expiresIn: '15m',
				issuer: 'screenhive.io',
				audience: 'screenhive_users'
			});
		} catch (err) {
			res.status(401);
			throw new Error('Not Authenticated!');
		}
	}

	@Mutation(() => String)
	async login(
		@Arg('username') username: string,
		@Arg('password') password: string,
		@Ctx() { res, prisma }: { res: Response; prisma: PrismaClient }
	) {
		try {
			const user = await prisma.user.findUnique({
				where: {
					username
				}
			});

			if (user && (await argon2.verify(user.password, password))) {
				res.cookie(
					'refresh_token',
					jsonwebtoken.sign({ id: user.id }, process.env.JWT_SECRET as string, {
						expiresIn: '7d',
						issuer: 'screenhive.io',
						audience: 'screenhive_users',
						algorithm: 'HS256'
					}),
					{ maxAge: 604800, httpOnly: true, domain: '.screenhive.io' }
				);

				await prisma.user.update({
					where: {
						username
					},
					data: {
						lastLogin: new Date()
					}
				});

				return jsonwebtoken.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, {
					expiresIn: '15m',
					issuer: 'screenhive.io',
					audience: 'screenhive_users'
				});
			}

			throw new Error();
		} catch (err) {
			res.status(401);
			throw new Error('Invalid Username or Password');
		}
	}

	@Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.SuperAdmin)
	@Mutation(() => Boolean)
	async logout(@Ctx()
	{
		res,
		cookies,
		user,
		prisma
	}: {
		res: Response;
		cookies: any;
		user: any;
		prisma: PrismaClient;
	}) {
		try {
			const decoded = jsonwebtoken.verify(cookies.refresh_token, process.env.JWT_SECRET as string) as any;

			return (
				decoded &&
				!!await prisma.revokedToken.create({
					data: {
						userId: user.id,
						token: cookies.refresh_token.split('.')[2],
						expiry: new Date(decoded.exp * 1000)
					}
				})
			);
		} catch (err) {
			res.status(500);
			return false;
		}
	}
}
