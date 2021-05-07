import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import { User } from '@generated/type-graphql';
import jsonwebtoken from 'jsonwebtoken';
import argon2 from 'argon2'

@Service()
@Resolver()
export class RegisterResolver {
	constructor() {}

	@Mutation((returns) => Boolean)
	public async verify(@Arg('token') token: string, @Ctx() { prisma, res }: { prisma: PrismaClient; res: Response }) {
		try {
			const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as { id: number };

			const sig = token.split('.')[2];

			const tok = await prisma.verificationToken.findFirst({
				where: {
					token: sig
				}
			});

			if (!tok) {
				throw new Error();
			}

			await prisma.verificationToken.delete({
				where: {
					userId_token: {
						userId: decoded.id,
						token: sig
					}
				}
			});

			await prisma.user.update({
				where: {
					id: decoded.id
				},
				data: {
					verified: true
				}
			});

			return true;
		} catch (err) {
			res.status(401);
			throw new Error('Invalid Token!');
		}
	}

	@Mutation((returns) => User)
	public async register(
		@Arg('username') username: string,
		@Arg('password') password: string,
		@Arg('email') email: string,
		@Arg('dob') dob: number,
		@Ctx() { res, prisma }: { res: Response; prisma: PrismaClient }
	) {
		try {
			const newUser = await prisma.user.create({
				data: {
					username,
					password: await argon2.hash(password),
					email,
					dob: new Date(dob),
					registered: new Date(),
					lastLogin: new Date()
				}
			});

			const verificationToken = jsonwebtoken.sign(
				{ id: newUser.id, email, username },
				process.env.JWT_SECRET as string,
				{ expiresIn: '30m' }
			);

			// send verification email here

			await prisma.verificationToken.create({
				data: {
					token: verificationToken.split('.')[2],
					userId: newUser.id,
					expiry: new Date(Date.now() + 30 * 60000)
				}
			});

			return newUser;
		} catch (err) {
			res.status(400);
			throw new Error('Failed to register!');
		}
	}
}
