import 'reflect-metadata';
import express from 'express';
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
import {createTransport, createTestAccount} from 'nodemailer';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { graphqlUploadExpress } from 'graphql-upload';




async function main() {
	config(); // dot env config setup

	const app = express(); // create the express instance

	const csrfProtection = csurf({
		cookie: {httpOnly: true},
		ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
	  });


	const rateLimiter = rateLimit({
		windowMs: 30 * 60 * 1000,
		max: 100
	})


	app.use(graphqlUploadExpress({maxFileSize: 1000000, maxFiles: 10}))
	app.use(json());
	//app.use(helmet())
	app.use(cookieParser());
	app.use(cors({origin: "*"}))
	//app.use(csrfProtection);
	//app.use(rateLimiter)
	
	app.use((req, res, next) => {
		//res.cookie('XSRF-TOKEN', req.csrfToken());
		next();
	})

	app.get("/csrf", (req, res) => {
		res.json({})
	})

	app.set('trust proxy', 1);




	const testAccount = await createTestAccount();

	const mail = createTransport({
		host: "smtp.ethereal.email",
		port: 587,
		secure: false,
		auth:{
			user: testAccount.user, 
			pass: testAccount.pass, 
		}
	})

	const schema = await buildSchema({
		resolvers: [ LoginResolver, RegisterResolver, UserResolver ],
		container: Container,
		authChecker: ({ root, args, context, info }, roles) => {
			try{
				const {authorization} = context.req.headers;

				const bearAuthRegex = /^Bearer\s[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/g

				if(!authorization || !bearAuthRegex.test(authorization)){
					throw new Error("Invalid Authorization Header!")
				}

				const token = authorization.split(" ")[1]; 

				context.user = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as any;

				return true
            }catch(err){
				context.res.status(401);
                return false;
            }

		}
	});

	const prisma = new PrismaClient();

	const server = new ApolloServer({
		schema,
		context: ({res, req}) => ({ res: res, req: req, cookies: req?.cookies || {}, prisma, mail }),
		playground: true,
		uploads: false
	});

	server.applyMiddleware({app, path: "/graphql"})
	const httpServer = http.createServer(app);

	httpServer.listen(8080, () => {
		console.log("Listening!")		
	})


	function signalHandler(signal: any){
		console.log(`*^!@4=> Received signal to terminate: ${signal}`)

		prisma.$disconnect();

		httpServer.close()

		server.stop()

	}

	process.on("SIGINT", signalHandler)
	process.on("SIGTERM", signalHandler)

}

main();
