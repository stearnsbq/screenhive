
import { Field, ID, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany, JoinTable } from "typeorm";
import { Role } from "./Role";


@ObjectType()
@Entity()
export class User extends BaseEntity{

    @Field(() => ID)
    @PrimaryGeneratedColumn()
    public id!: number;

    @Field(() => String)
    @Column({nullable: false, unique: true})
    public username!: string;

    @Field(() => String)
    @Column({nullable: false, unique: true})
    public email!: string;

    @Field(() => String)
    @Column()
    public password!: string;

    @Field(() => Date)
    @Column({nullable: false})
    public dob!: Date;

    @Field(() => Date)
    @Column({nullable: false})
    public registered!: Date;

    @Field(() => Boolean)
    @Column({default: false})
    public verified!: boolean;

    @Field(() => Date)
    @Column()
    public lastLogin!: Date;


    @ManyToMany(() => Role)
    @JoinTable()
    public roles!: Role[];

}