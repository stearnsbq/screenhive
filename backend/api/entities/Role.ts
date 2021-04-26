import { Field, ID, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";


@ObjectType()
@Entity()
export class Role extends BaseEntity{

    @Field(() => ID)
    @PrimaryGeneratedColumn()
    public id!: number;

    @Field(() => String)
    @Column({nullable: false, unique: true})
    public name!: string;

    @Field(() => String)
    @Column({nullable: false})
    public description!: string;
    
}