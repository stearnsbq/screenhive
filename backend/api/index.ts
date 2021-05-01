import 'reflect-metadata';
import express, { Router } from 'express';
import { json } from 'body-parser';
import { config } from 'dotenv';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './resolvers/UserResolver';
import { LoginResolver } from './resolvers/LoginResolver';
import { RegisterResolver } from './resolvers/RegisterResolver';
import jsonwebtoken from 'jsonwebtoken'
import { PrismaClient } from '.prisma/client';
import { ApolloServer } from "apollo-server-express";
import http from 'http'
import {Container} from 'typedi';
import cors from 'cors';
const cookieParser = require('cookie-parser');



async function main() {
	config(); // dot env config setup

	const app = express(); // create the express instance

	app.use(json());
	app.use(cookieParser());
	app.use(cors({origin: "*"}))

	const schema = await buildSchema({
		resolvers: [ LoginResolver, RegisterResolver, UserResolver ],
		container: Container,
		authChecker: ({ root, args, context, info }, roles) => {
            const {authorization} = context.req.headers;

            const token = authorization.split(" ")[1]; // replace this with a regex

            try{
			   context.user = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as any;;

			   return roles.some((element) => element === context.user.role)
            }catch(err){
				context.res.status(401);
                return false;
            }

		}
	});

	const prisma = new PrismaClient();

	const server = new ApolloServer({
		schema,
		context: ({res, req}) => ({ res: res, req: req, cookies: req?.cookies || {}, prisma }),
		playground: true,
	});

	server.applyMiddleware({app, path: "/graphql"})
	const httpServer = http.createServer(app);

	httpServer.listen(8080, () => {
		console.log("Listening!")		
	})
}

main();
