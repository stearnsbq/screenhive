import { Resolver, Query, Mutation, Ctx, Arg } from "type-graphql";
import { User } from "../entities/User";
import { Service } from "typedi";
import { UserService } from "../services/UserService";
import { Role } from "../entities/Role";

@Service()
@Resolver(of => User)
export class UserResolver {

  constructor(private userService: UserService){

  }


  @Query(returns => [User])
  async users(@Ctx() ctx: any) {
    const user = ctx.user;

    if(user.level != "admin"){
        ctx.res.status(401);
        throw new Error("Not an admin!");
    }

    return await this.userService.getUsers();
  }


  @Query(returns => User)
  async user(@Ctx() ctx: any) {
    const user = ctx.user;

    if(user){
        return await this.userService.getUser({id: user.id})
    }


    ctx.res.status(401);
    throw new Error("Not Authenticated");
  }


  @Mutation(returns => User)
  async updateRoles(@Arg("roles") roles: Role[], @Ctx() ctx: any){
    const user = ctx.user;


    if(user){

      const usr = await this.userService.getUser({id: user.id})

      usr?.roles.push(...roles);

      return usr;
    }

    ctx.res.status(401);
    throw new Error("Not Authenticated");
  }


}