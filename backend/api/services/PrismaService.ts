import { PrismaClient } from ".prisma/client";
import { Service, Inject } from "typedi";

@Service()
export class PrismaService {

    public prisma : PrismaClient

    constructor(){
        this.prisma = new PrismaClient();
    }

}