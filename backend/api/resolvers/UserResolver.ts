import { Resolver, Query, Mutation, Ctx, Arg, Authorized, FieldResolver, Root, ResolverInterface } from 'type-graphql';
import { Service } from 'typedi';
import { User, RevokedToken, Report } from '@generated/type-graphql';
import { Role } from '../enum/Role';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

@Service()
@Resolver((of) => User)
export class UserResolver {
	constructor() {}

	@FieldResolver(() => [ RevokedToken ])
	public async revokedTokens(@Root() user: User, @Ctx() { prisma }: { prisma: PrismaClient }) {
		return await prisma.revokedToken.findMany({
			where: {
				userId: user.id
			}
		});
	}



	@FieldResolver(() => [ String ])
	public async friends(@Root() user: User, @Ctx() { prisma }: { prisma: PrismaClient }) {
		return (await prisma.user.findUnique({
			where: {
				id: user.id
			},
			select:{
				friends: {
					select: {
						username: true
					}
				}
			}
		}))?.friends || [];
	}

	@FieldResolver(() => [ Report ])
	public async reports(@Root() user: User, @Ctx() { prisma }: { prisma: PrismaClient }) {
		return (await prisma.user.findUnique({
			where: {
				id: user.id
			},
			select:{
				reports: true
			}
		}))?.reports || [];
	}


	@FieldResolver(() => [ Report ])
	public async reportsAgainstUser(@Root() user: User, @Ctx() { prisma }: { prisma: PrismaClient }) {
		return (await prisma.user.findUnique({
			where: {
				id: user.id
			},
			select:{
				reportsAgainstUser: true
			}
		}))?.reportsAgainstUser || [];
	}

	@Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.SuperAdmin)
	@Query((returns) => User)
	async user(@Ctx() { user, prisma }: { user: any; prisma: PrismaClient }) {
		return await prisma.user.findUnique({
			where: {
				id: user.id
			}
		});
	}

	@Authorized<Role>(Role.Admin, Role.SuperAdmin)
	@Mutation((returns) => User)
	async updateRole(
		@Arg('role') role: Role,
		@Ctx() { user, res, prisma }: { user: any; res: Response; prisma: PrismaClient }
	) {
		try {
			return await prisma.user.update({
				where: {
					id: user.id
				},
				data: {
					role: role
				}
			});
		} catch (err) {
			res.status(401);
			throw new Error('Not Authenticated');
		}
	}
}
