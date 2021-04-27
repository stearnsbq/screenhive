import 'reflect-metadata';
import express, { Router } from 'express';
import { json } from 'body-parser';
import { config } from 'dotenv';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './resolvers/UserResolver';
import { LoginResolver } from './resolvers/LoginResolver';
import { Container } from 'typedi';
import { RegisterResolver } from './resolvers/RegisterResolver';
const jwt = require('express-jwt');
const { graphqlHTTP } = require('express-graphql');
const cookieParser = require('cookie-parser');

async function main() {
	config(); // dot env config setup

	const app = express(); // create the express instance

	app.use(json());
	app.use(cookieParser());

	const schema = await buildSchema({
		resolvers: [ UserResolver, LoginResolver, RegisterResolver ],
		container: Container,
		authChecker: ({ root, args, context, info }, roles) => {
			const user = context.user;

			return roles.some((element) => element === user.role);
		}
	});

	const authMiddleware = jwt({
		secret: process.env.JWT_SECRET,
		credentialsRequired: false,
		algorithms: [ 'HS256' ]
	});

	app.use(
		'/graphql',
		authMiddleware,
		graphqlHTTP((_: any, res: any, req: any) => ({
			schema,
			context: { res, user: res.req.user, cookies: res.req.cookies }
		}))
	);

	app.listen(8080, () => {
		console.log('running!');
	});
}

main();
