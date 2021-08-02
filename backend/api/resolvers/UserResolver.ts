import { Resolver, Query, Mutation, Ctx, Arg, Authorized, FieldResolver, Root, Info, ResolverInterface } from 'type-graphql';
import { Service } from 'typedi';
import { User, RevokedToken, Report } from '@generated/type-graphql';
import { Role } from '../enum/Role';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import argon2 from 'argon2';
import { GraphQLUpload } from 'graphql-upload';
import { createWriteStream, existsSync, fstat, mkdirSync, unlinkSync } from 'fs';
import sharp from 'sharp'


@Service()
@Resolver((of) => User)
export class UserResolver {
	constructor() {}

	@FieldResolver()
	public password() {
		return '';
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
	async enable2FA(
		@Ctx() { user, res, prisma }: { user: any; res: Response; prisma: PrismaClient }
	) {

			if(!(await prisma.user.count({where: {id: user.id}}) > 1)){
				res.status(401)
				throw new Error("User does not exist!")
			}
	
	
			await prisma.user.update({
				where:{
					id: user.id
				},
				data:{
					twoFactorEnabled: true
				}
			})
	
	
			return true;
	}




	@Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.SuperAdmin)
	@Mutation((returns) => Boolean)
	async uploadAvatar(
		@Arg('avatar', () => GraphQLUpload) {createReadStream, filename}: any,
		@Ctx() { user, res, prisma }: { user: any; res: Response; prisma: PrismaClient }
	) {
		try{

			const userAvatarFolderLoc = `./static/${process.env.AVATAR_LOCATION as string}/${user.username}/`

			if(!existsSync(userAvatarFolderLoc)){
				mkdirSync(userAvatarFolderLoc, {recursive: true})
			}

			const result = (await Promise.all([184, 64, 32].map((size) => {
				return new Promise((resolve, reject) => {
					createReadStream()
					.pipe(sharp().resize(size, size).jpeg())
					.pipe(createWriteStream(`${userAvatarFolderLoc}/avatar-${size}.jpg`, {flags: "w+"}))
					.on("finish", () => resolve(true))
					.on("error", (err: any) => reject(err))
				})
			})))


			if(result.includes(false)){
				// clean up files if one failed to resize / upload properly
				unlinkSync(`${userAvatarFolderLoc}/avatar-184.jpg`)
				unlinkSync(`${userAvatarFolderLoc}/avatar-64.jpg`)
				unlinkSync(`${userAvatarFolderLoc}/avatar-32.jpg`)


				res.status(500)
				return false;
			}

			return true;
		}catch(err: any){
			res.status(500)
			throw new Error(err);
		}

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
		} catch (err: any) {
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
		} catch (err: any) {
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
		} catch (err: any) {
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
		} catch (err: any) {
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
		} catch (err: any) {
			res.status(500);
			throw new Error(err);
		}
	}
}
