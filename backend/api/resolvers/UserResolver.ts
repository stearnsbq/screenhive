import { Resolver, Query, Mutation, Ctx, Arg, Authorized } from "type-graphql";
import { Role, User } from "../entities/User";
import { Service } from "typedi";
import { UserService } from "../services/UserService";

@Service()
@Resolver(of => User)
export class UserResolver {

  constructor(private userService: UserService){

  }

  @Authorized<Role>(Role.Admin, Role.Superuser)
  @Query(returns => [User])
  async users(@Ctx() ctx: any) {
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

  @Authorized<Role>(Role.Admin, Role.Superuser)
  @Mutation(returns => User)
  async updateRoles(@Arg("roles") role: Role, @Ctx() ctx: any){
    const user = ctx.user;

    try{

        const usr = await this.userService.getUser({id: user.id})

        usr.role = role;

        await usr?.save();
    
        return usr;


    }catch(err){
      ctx.res.status(401);
      throw new Error("Not Authenticated");
    }


  }


}