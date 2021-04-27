import { Service, Inject } from "typedi";
import { getRepository, Repository } from "typeorm";
import { User } from "../entities/User";
import argon2 from 'argon2'
import { RevokedToken } from "../entities/RevokedToken";
import { UserService } from "./UserService";
import jsonwebtoken from 'jsonwebtoken';


@Service()
export class RevokedTokenService {
    private tokenRepo : Repository<RevokedToken>;
    constructor(private user : UserService){
        this.tokenRepo = getRepository(RevokedToken);
    }


    public async revokeToken(user: User, token: string){

        const revoked = new RevokedToken();

        revoked.token = token.split(".")[2]; // store the signature
        revoked.user = user;

        let decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as any;

        revoked.expiry = new Date(decoded.exp * 1000);

        await this.tokenRepo.save(revoked);

        return revoked;
    }



    public async revokeTokens(id: number, refresh : string){
            const user = await this.user.getUser({id})


            this.tokenRepo.insert(await this.revokeToken(user, refresh));
    
            await this.user.saveUser(user);
    
            return true;

    }


}

