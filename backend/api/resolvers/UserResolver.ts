import { Resolver, Query, Mutation, Ctx, Arg, Authorized, FieldResolver, Root, Info, ResolverInterface } from 'type-graphql';
import { Service } from 'typedi';
import { User, RevokedToken, Report } from '@generated/type-graphql';
import { Role } from '../enum/Role';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import argon2 from 'argon2';

@Service()
@Resolver((of) => User)
export class UserResolver {
	constructor() {}

	@FieldResolver()
	public password() {
		return '';
	}

	@FieldResolver(() => [ String ])
	public async friends(@Root() user: User, @Ctx() { prisma }: { prisma: PrismaClient }) {
		return (
		  (
		    await prisma.user.findUnique({
		      where: {
		        id: user.id,
		      },
		      select: {
		        friends: {
		          select: {
		            username: true,
		          },
		        },
		      },
		    })
		  )?.friends || []
		)
	}

	@FieldResolver(() => [ Report ])
	public async reports(@Root() user: User, @Ctx() { prisma }: { prisma: PrismaClient }) {
		return await prisma.report.findMany({
			where: {
				reporter: user.id
			}
		});
	}

	@FieldResolver(() => [ Report ])
	public async reportsAgainstUser(@Root() user: User, @Ctx() { prisma }: { prisma: PrismaClient }) {
		return await prisma.report.findMany({
			where: {
				reportee: user.id
			}
		});
	}

	@Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.SuperAdmin)
	@Mutation((returns) => Boolean)
	async updateUsername(
		@Arg('username') username: string,
		@Ctx() { user, res, prisma }: { user: any; res: Response; prisma: PrismaClient }
	) {
		try {
			const usr = await prisma.user.update({
				where: {
					id: user.id
				},
				data: {
					username
				}
			});

			return !!usr;
		} catch (err) {
			res.status(500);
			throw new Error(err);
		}
	}

	@Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.SuperAdmin)
	@Mutation((returns) => Boolean)
	async updateEmail(
		@Arg('email') email: string,
		@Ctx() { user, res, prisma }: { user: any; res: Response; prisma: PrismaClient }
	) {
		try {
			const usr = await prisma.user.update({
				where: {
					id: user.id
				},
				data: {
					email
				}
			});

			return !!usr;
		} catch (err) {
			res.status(500);
			throw new Error(err);
		}
	}

	@Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.SuperAdmin)
	@Mutation((returns) => Boolean)
	async updateDOB(
		@Arg('dob') dob: string,
		@Ctx() { user, res, prisma }: { user: any; res: Response; prisma: PrismaClient }
	) {
		try {
			const usr = await prisma.user.update({
				where: {
					id: user.id
				},
				data: {
					dob
				}
			});

			return !!usr;
		} catch (err) {
			res.status(500);
			throw new Error(err);
		}
	}

	@Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.SuperAdmin)
	@Mutation((returns) => Boolean)
	async changePassword(
		@Arg('password') password: string,
		@Arg('confirmPassword') confirmPassword: string,
		@Ctx() { user, res, prisma }: { user: any; res: Response; prisma: PrismaClient }
	) {
		try {
			if (password !== confirmPassword) {
				return false;
			}

			const usr = await prisma.user.update({
				where: {
					id: user.id
				},
				data: {
					password: await argon2.hash(password)
				}
			});

			return !!usr;
		} catch (err) {
			res.status(500);
			throw new Error(err);
		}
	}

	@Authorized()
	@Query((returns) => User)
	async user(@Ctx() { user, prisma }: { user: any; prisma: PrismaClient }, @Info() info: any) {
		return await prisma.user.findUnique({
			where: {
				id: user.id
			}
		});
	}

	@Query((returns) => Boolean)
	async checkIfUserExists(
		@Arg('username') username: string,
		@Ctx() { res, prisma }: { res: Response; prisma: PrismaClient }
	) {
		try {
			return (
				(await prisma.user.count({
					where: {
						username
					}
				})) > 0
			);
		} catch (err) {
			res.status(500);
			throw new Error(err);
		}
	}
}
