import { Resolver, Query, Mutation, Ctx, Arg, Authorized } from "type-graphql";
import { Service } from "typedi";
import { UserService } from "../services/UserService";
import { User, RevokedToken } from "@generated/type-graphql";
import { Role } from "../enum/Role";




@Service()
@Resolver(of => User)
export class UserResolver {

  constructor(private userService: UserService){

  }

  @Authorized<Role>(Role.Admin, Role.SuperAdmin)
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

  @Authorized<Role>(Role.Admin, Role.SuperAdmin)
  @Mutation(returns => User)
  async updateRoles(@Arg("roles") role: Role, @Ctx() ctx: any){
    const user = ctx.user;

    try{

        const usr = await this.userService.getUser({id: user.id})

        if(usr){

          usr.role = role;

          await this.userService.saveUser(usr)
      
          return usr;
        }

        throw new Error("User Does Not Exist!");

    }catch(err){
      ctx.res.status(401);
      throw new Error("Not Authenticated");
    }


  }


}