
import { Field, ID, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany, JoinTable, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./User";




@ObjectType()
@Entity()
export class RevokedToken extends BaseEntity{

    // @Field(() => ID)
    // @PrimaryColumn()
    // public userId!: number;

    @Field(() => User)
    @ManyToOne(() => User, user => user.revokedTokens, {primary: true})
    public user!: User;

    @Field(() => String)
    @PrimaryColumn()
    @Column({nullable: false})
    public token!: string;

    @Field(() => Date)
    @Column({nullable: false})
    public expiry!: Date;

}