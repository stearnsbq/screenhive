import { Resolver, Query, Mutation, Arg, Ctx, ResolverInterface, Authorized } from 'type-graphql';
import argon2 from 'argon2';
import jsonwebtoken from 'jsonwebtoken';
import { Service } from 'typedi';
import { Role } from '../enum/Role';
import { Response } from 'express';
import { Prisma, PrismaClient, User } from '.prisma/client';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { authenticator, totp } from 'otplib';
import { Any } from 'typeorm';
import { EmailService } from '../services/EmailService';
import { PrismaService } from '../services/PrismaService';

@Service()
@Resolver()
export class LoginResolver {
	constructor(private emailService : EmailService, private prismaService: PrismaService) {}

	@Query(() => String)
	async refreshToken(@Ctx() { cookies, res }: { cookies: any; res: Response;  }) {
		try {
			const token = cookies.refresh_token;


			if ((await this.prismaService.revokedToken.count({ where: { token: token.split('.')[2] } })) > 0) {
				throw new Error('Revoked Token!');
			}

			const refresh_token = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as {
				id: number;
			};

			const user = (await this.prismaService.user.findUnique({
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
			console.log(err)
			res.status(401);
			throw new Error('Not Authenticated!');
		}
	}

	@Mutation(() => String)
	async login(
		@Arg('username') username: string,
		@Arg('password') password: string,
		@Arg('twoFactor') twoFactor: string,
		@Ctx() { res }: { res: Response; }
	) {
		try {
			const user = await this.prismaService.user.findUnique({
				where: {
					username
				},
				include: {
					roles: true
				}
			});

			if(!twoFactor && user?.twoFactorEnabled){
				throw new Error("User has two factor enabled however is missing a code!")
			}

			if (user && (await argon2.verify(user.password, password)) && authenticator.check(twoFactor, process.env.OTP_SECRET as string)) {
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

				await this.prismaService.user.update({
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

			throw new Error('Invalid Username or Password');
		} catch (err: any) {
			res.status(401);
			throw new Error(err);
		}
	}

	@Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.SuperAdmin)
	@Mutation(() => Boolean)
	async logout(@Ctx()
	{
		res,
		cookies,
		user,
	}: {
		res: Response;
		cookies: any;
		user: any;
	}) {
		try {
			const token = cookies.refresh_token;
			const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as any;

			res.clearCookie('refresh_token');

			return (
				decoded &&
				!!await this.prismaService.revokedToken.create({
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
		@Ctx() { res }: { res: Response; },
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string
	) {
		try {
			if (!jsonwebtoken.verify(token, process.env.JWT_SECRET as string)) {
				throw new Error('Invalid Token!');
			}

			const decoded = jsonwebtoken.decode(token) as any;

			await this.prismaService.user.update({
				where: {
					email: decoded.email
				},
				data: {
					password: await argon2.hash(newPassword)
				}
			});

			return true;
		} catch (err: any) {
			res.status(500);
			throw new Error(err);
		}
	}

	@Query(() => Boolean)
	async resetPasswordRequest(
		@Ctx()
		{
			res,
		}: { res: Response;},
		@Arg('email') email: string
	) {
		if ((await this.prismaService.user.count({ where: { email } })) > 0) {
			const token = jsonwebtoken.sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '1hr' });

			await this.emailService.sendResetPassword(email, token)
		}

		return true;
	}
}
