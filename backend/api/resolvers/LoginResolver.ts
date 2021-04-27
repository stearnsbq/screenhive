import { Resolver, Query, Mutation, Arg, Ctx, ResolverInterface, Authorized } from 'type-graphql';
import argon2 from 'argon2';
import jsonwebtoken from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { Service } from 'typedi';
import { Role } from '../entities/User';
import { RevokedTokenService } from '../services/RevokedTokenService';

@Service()
@Resolver()
export class LoginResolver {
	constructor(private userService: UserService, private revokedTokensService : RevokedTokenService) {}

    @Query(() => String)
    async getNewAccessToken(@Ctx() ctx: any){
        const cookies = ctx.cookies;
        const user = ctx.user;

        try{

            const refresh_token = jsonwebtoken.verify(cookies.refresh_token, process.env.JWT_SECRET as string) as {id: number};

            return jsonwebtoken.sign({ id: refresh_token.id }, process.env.JWT_SECRET as string, {
                    expiresIn: '15m',
                    issuer: 'screenhive.io',
                    audience: 'screenhive_users'
            });

        }catch(err){
            ctx.res.status(401);
            throw new Error('Not Authenticated!');
        }

    }



	@Mutation(() => String)
	async login(@Arg('username') username: string, @Arg('password') password: string, @Ctx() ctx: any) {
		const res = ctx.res;

        try{

            const user = await this.userService.getUser({ username });

            if (user && (await argon2.verify(user.password, password))) {
                res.cookie(
                    'refresh_token',
                    jsonwebtoken.sign({id: user.id}, process.env.JWT_SECRET as string, {
                        expiresIn: '7d',
                        issuer: 'screenhive.io',
                        audience: 'screenhive_users',
                        algorithm: 'HS256'
                    }),
                    { maxAge: 604800, httpOnly: true }
                );
    
                user.lastLogin = new Date();
    
                this.userService.saveUser(user);
    
                return jsonwebtoken.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, {
                    expiresIn: '15m',
                    issuer: 'screenhive.io',
                    audience: 'screenhive_users'
                });
            }

        }catch(err){
            ctx.res.status(401);
            throw new Error('Invalid Username or Password');
        }


	}



    @Authorized<Role>(Role.User, Role.Moderator, Role.Admin, Role.Superuser)
    @Mutation(() => Boolean)
    async logout(@Ctx() ctx: any){
        const cookies = ctx.cookies;
        const user = ctx.user;

        try{

            if(jsonwebtoken.verify(cookies.refresh_token, process.env.JWT_SECRET as string)){
                return await this.revokedTokensService.revokeTokens(user.id, cookies.refresh_token);
            }

            return false;

        }catch(err){
            return false;
        }

    }


}
