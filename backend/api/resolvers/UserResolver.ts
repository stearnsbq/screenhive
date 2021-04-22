import { Resolver, Query, Mutation, Ctx } from "type-graphql";
import { User } from "../entities/User";
import { Service } from "typedi";

@Service()
@Resolver(of => User)
export class UserResolver {


  @Query(returns => [User])
  async users(@Ctx() ctx: any) {
    const user = ctx.user;

    if(user.level != "admin"){
        ctx.res.status(401);
        throw new Error("Not an admin!");
    }

    return await User.find();
  }


  @Query(returns => User)
  async user(@Ctx() ctx: any) {
    const user = ctx.user;


    if(user){
        return await User.findOne({id: user.id})
    }


    ctx.res.status(401);
    throw new Error("Not Authenticated");


  }

}