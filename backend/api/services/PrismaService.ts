import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";

@Service()
export class PrismaService{

    private prisma: PrismaClient

    constructor(){
        this.prisma = new PrismaClient();
    }

    get user(){
        return this.prisma.user;
    }

    get revokedToken(){
        return this.prisma.revokedToken;
    }

    get accountOffense(){
        return this.prisma.accountOffense;
    }

    get permission(){
        return this.prisma.permission;
    }

    get report(){
        return this.prisma.report;
    }

    get role(){
        return this.prisma.role;
    }

    get premiumSubscription(){
        return this.prisma.premiumSubscription
    }

}