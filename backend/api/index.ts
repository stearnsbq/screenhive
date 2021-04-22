import { attachControllers } from '@decorators/express';
import express, { Router } from 'express'
import {json} from 'body-parser';
import {config} from 'dotenv';
import { createConnection } from 'typeorm';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './resolvers/UserResolver';
import { LoginResolver } from './resolvers/LoginResolver';
import { Container } from "typedi";
import { RegisterResolver } from './resolvers/RegisterResolver';
const jwt = require('express-jwt')
const { graphqlHTTP } = require('express-graphql');
const cookieParser = require('cookie-parser');

async function main(){

    config(); // dot env config setup

    const app = express() // create the express instance

    app.use(json());
    app.use(cookieParser());


    const connection = await createConnection()
    const schema = await buildSchema({
        resolvers: [UserResolver, LoginResolver, RegisterResolver], 
        container: Container
    })


    const authMiddleware = jwt({
        secret: process.env.JWT_SECRET,
        credentialsRequired: false,
        algorithms: ['HS256']
    })


    app.use('/graphql', authMiddleware, graphqlHTTP((_: any, res: any, req: any) => ({
        schema: schema,
        context: {res, user: res.req.user}
    })))

    app.listen(8080, () => {
        console.log("running!")
    })

}

main()


