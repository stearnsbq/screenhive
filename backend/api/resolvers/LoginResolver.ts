import { Resolver, Query, Mutation, Arg, Ctx, ResolverInterface, Authorized } from 'type-graphql';
import argon2 from 'argon2';
import jsonwebtoken from 'jsonwebtoken';
import { Service } from 'typedi';
import { Role } from '../enum/Role';
import { Response } from 'express';
import { Prisma, PrismaClient, User } from '.prisma/client';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Service()
@Resolver()
export class LoginResolver {
	constructor() {}

	@Query(() => String)
	async refreshToken(@Ctx() { cookies, res, prisma }: { cookies: any; res: Response; prisma: PrismaClient }) {
		try {
			const token = cookies.refresh_token;

			if ((await prisma.revokedToken.count({ where: { token: token.split('.')[2] } })) > 0) {
				throw new Error('Revoked Token!');
			}

			const refresh_token = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as {
				id: number;
			};

			const user = (await prisma.user.findUnique({
				where: {
					id: refresh_token.id
				},
				include: {
					roles: true
				}
			})) as any;

			return jsonwebtoken.sign(
				{ id: user.id, username: user.username, roles: user.roles },
				process.env.JWT_SECRET as string,
				{
					expiresIn: '15m',
					issuer: 'screenhive.io',
					audience: 'screenhive_users'
				}
			);
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
				},
				include: {
					roles: true
				}
			});

			console.log(password);

			if (user && (await argon2.verify(user.password, password))) {
				res.cookie(
					'refresh_token',
					jsonwebtoken.sign({ id: user.id }, process.env.JWT_SECRET as string, {
						expiresIn: '7d',
						issuer: 'screenhive.io',
						audience: 'screenhive_users',
						algorithm: 'HS256'
					}),
					{ maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, /*domain: ".screenhive.io",*/ sameSite: true }
				);

				await prisma.user.update({
					where: {
						username
					},
					data: {
						lastLogin: new Date()
					}
				});

				return jsonwebtoken.sign(
					{ id: user.id, username: user.username, roles: user.roles },
					process.env.JWT_SECRET as string,
					{
						expiresIn: '15m',
						issuer: 'screenhive.io',
						audience: 'screenhive_users'
					}
				);
			}

			throw new Error();
		} catch (err) {
			console.log(err);
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
			const token = cookies.refresh_token;
			const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as any;

			res.clearCookie('refresh_token');

			return (
				decoded &&
				!!await prisma.revokedToken.create({
					data: {
						token: token.split('.')[2],
						expiry: new Date(decoded.exp * 1000)
					}
				})
			);
		} catch (err) {
			res.status(500);
			return false;
		}
	}

	@Query(() => Boolean)
	async resetPassword(
		@Ctx() { res, prisma }: { res: Response; prisma: PrismaClient },
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string
	) {
		try {
			if (!jsonwebtoken.verify(token, process.env.JWT_SECRET as string)) {
				throw new Error('Invalid Token!');
			}

			const decoded = jsonwebtoken.decode(token) as any;

			await prisma.user.update({
				where: {
					email: decoded.email
				},
				data: {
					password: await argon2.hash(newPassword)
				}
			});

			return true;
		} catch (err) {
			res.status(500);
			throw new Error(err);
		}
	}

	@Query(() => Boolean)
	async resetPasswordRequest(
		@Ctx()
		{
			res,
			prisma,
			mail
		}: { res: Response; prisma: PrismaClient; mail: Transporter<SMTPTransport.SentMessageInfo> },
		@Arg('email') email: string
	) {
		if ((await prisma.user.count({ where: { email } })) > 0) {
			const token = jsonwebtoken.sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '1hr' });

			await mail.sendMail({
				from: '"Screenhive No Reply" no-reply@screenhive.io',
				to: email,
				subject: 'Reset Password Request',
				html: `
						  <p>
							To Reset Your Password
							<a href="https://screenhive.io/passwordreset?=${token}">Click Here!</a>
							Expires in 1hr
						  </p>
						  <p>
							  If that link doesn't work click here: https://screenhive.io/passwordreset?=${token}
						  </p>
						`
			});
		}

		return true;
	}
}
