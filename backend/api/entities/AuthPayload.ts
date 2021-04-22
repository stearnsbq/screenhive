import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class AuthPayload{
    @Field(() => String)
    public access_token!: string;

}