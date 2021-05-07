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
import csurf from 'csurf';
const cookieParser = require('cookie-parser');
const helmet = require("helmet")



async function main() {
	config(); // dot env config setup

	const app = express(); // create the express instance

	const csrfProtection = csurf({
		cookie: {httpOnly: true},
		ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
	  });

	app.use(json());
	app.use(helmet())
	app.use(cookieParser());
	app.use(cors({origin: "*"}))
	//app.use(csrfProtection);
	
	// app.use((req, res, next) => {
	// 	res.cookie('XSRF-TOKEN', req.csrfToken());
	// 	next();
	// })

	app.get("/csrf", (req, res) => {
		res.json({})
	})

	const schema = await buildSchema({
		resolvers: [ LoginResolver, RegisterResolver, UserResolver ],
		container: Container,
		authChecker: ({ root, args, context, info }, roles) => {
			try{
				const {authorization} = context.req.headers;

				const bearAuthRegex = /^Bearer\s[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/g

				if(!authorization || !bearAuthRegex.test(authorization)){
					console.log("do")
					throw new Error("Invalid Authorization Header!")
				}

				const token = authorization.split(" ")[1]; 

				context.user = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as any;

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
