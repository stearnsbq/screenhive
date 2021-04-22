
import { Field, ID, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";



@ObjectType()
@Entity()
export class User extends BaseEntity{

    @Field(() => ID)
    @PrimaryGeneratedColumn()
    public id!: number;

    @Field(() => String)
    @Column({default: "user"})
    public level!: string;

    @Field(() => String)
    @Column({unique: true})
    public username!: string;

    @Field(() => String)
    @Column({unique: true})
    public email!: string;

    @Field(() => String)
    @Column()
    public password!: string;

    @Field(() => Date)
    @Column()
    public dob!: Date;

    @Field(() => Date)
    @Column()
    public registered!: Date;

    @Field(() => Boolean)
    @Column({default: false})
    public verified!: boolean;


    @Field(() => Boolean)
    @Column({default: false})
    public premium!: boolean;


}