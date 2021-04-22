import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { getRepository } from "typeorm";
import { User } from "../entities/User";
import { UserService } from "../services/UserService";
import { Service } from "typedi";

@Service()
@Resolver()
export class RegisterResolver{

    constructor(private userService : UserService){

    }

    @Mutation(returns => Boolean)
    public async register(@Arg("username") username : string, @Arg("password") password : string, @Arg("email") email : string, @Arg("dob") dob : number, @Ctx() ctx: any){
        try{
            await this.userService.createUser(email, username, password, dob);
            return true
        }catch(err){
            ctx.res.status(400)
            throw new Error("Failed to login!")
        }

    }

}