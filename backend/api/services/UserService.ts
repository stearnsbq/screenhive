import { Service, Inject } from "typedi";
import { getRepository, Repository } from "typeorm";
import { User } from "../entities/User";
import argon2 from 'argon2'


@Service()
export class UserService {
    private userRepo : Repository<User>;
    constructor(){
        this.userRepo = getRepository(User);
    }

    public getUser(fields: {username?: string, email?: string, id?: number}){
        return this.userRepo.findOne(fields);
    }

    public async createUser(email : string, username : string, password : string, dob: number){
            const newUser = this.userRepo.create();

            newUser.email = email;
            newUser.username = username;
            newUser.dob = new Date(dob);
            newUser.password = await argon2.hash(password);
            newUser.registered = new Date();
            await this.userRepo.save(newUser);
            return newUser;

    }


}

