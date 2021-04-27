
import { Field, ID, ObjectType } from "type-graphql";
import { RevokedToken } from "./RevokedToken";


export enum Role{
    User = 0,
    Moderator = 1,
    Admin = 2,
    Superuser = 3
}


@ObjectType()
export class User{

    @Field(() => ID)
    public id!: number;

    @Field(() => String)
    public username!: string;

    @Field(() => String)
    public email!: string;

    @Field(() => String)
    public password!: string;

    @Field(() => Date)
    public dob!: Date;

    @Field(() => Date)
    public registered!: Date;

    @Field(() => Boolean)
    public verified!: boolean;

    @Field(() => Date)
    public lastLogin!: Date;

    @Field(() => String)
    public role!: Role;

    public revokedTokens! : RevokedToken[];
}