import { Service, Inject } from "typedi";
import argon2 from 'argon2'
import { PrismaService } from "./PrismaService";
import { PrismaClient } from ".prisma/client";
import { User } from "@generated/type-graphql";
import { Role } from "../enum/Role";

@Service()
export class UserService {
    private prisma :  PrismaClient;
    constructor(private prismaService : PrismaService){
        this.prisma = prismaService.prisma;
    }

    public getUsers(){
        return this.prisma.user.findMany();
    }

    public getUser(fields: {username?: string, email?: string, id?: number}) {
        return this.prisma.user.findFirst({where: {
            ...fields
        }})
    }
    

    public async createUser(email : string, username : string, password : string, dob: number){
            const newUser = await this.prisma.user.create({
                data:{
                    email,
                    username,
                    dob: new Date(dob),
                    password: await argon2.hash(password),
                    registered: new Date(),
                    lastLogin: new Date()
                }
            })


            return newUser;
    }


    public saveUser(user: User){
       return this.prisma.user.update({
            where:{
                id: user.id
            },
            data:{
                ...user
            }
        })
    }


}

