import { Resolver, Query, Mutation, Arg, Ctx, ResolverInterface } from "type-graphql";
import { getRepository } from "typeorm";
import { AuthPayload } from "../entities/AuthPayload";
import { User } from "../entities/User";
import argon2 from 'argon2'
import jsonwebtoken from 'jsonwebtoken'
import { UserService } from "../services/UserService";
import { Service } from "typedi";

@Service()
@Resolver()
export class LoginResolver {

    constructor(private userService : UserService){

    }

  @Query(() => String)
  async login(@Arg("username") username: string, @Arg("password") password: string, @Ctx() ctx : any) {
    const res = ctx.res;
    
        const user = await this.userService.getUser({username});

        if (user) {
            if (await argon2.verify(user.password, password)) {
                res.cookie(
                    'refresh_token',
                    jsonwebtoken.sign({}, process.env.JWT_SECRET as string, { expiresIn: '7d', issuer: "screenhive.io", audience: "screenhive_users", algorithm: "HS256" }),
                    { maxAge: 604800, httpOnly: true }
                ); // set a refresh token cookie


                return jsonwebtoken.sign(
                    { id: user.id, level: user.level },
                    process.env.JWT_SECRET as string,
                    { expiresIn: '15m', issuer: "screenhive.io", audience: "screenhive_users" }
                )

            }
        }

        throw new Error("Invalid Username or Password")

  }

}