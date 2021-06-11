import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import { User } from '@generated/type-graphql';
import jsonwebtoken from 'jsonwebtoken';
import argon2 from 'argon2'
import {verify} from 'hcaptcha';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';



@Service()
@Resolver()
export class RegisterResolver {
	constructor() {}

	@Mutation((returns) => Boolean)
	public async verify(@Arg('token') token: string, @Ctx() { prisma, res }: { prisma: PrismaClient; res: Response }) {
		try {
			const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as { email: string };

			await prisma.user.update({
				where: {
					email: decoded.email
				},
				data: {
					verified: true
				}
			});

			return true;
		} catch (err) {
			res.status(401);
			throw new Error('Invalid Token!');
		}
	}

	@Mutation((returns) => Boolean)
	public async register(
		@Arg('username') username: string,
		@Arg('password') password: string,
		@Arg('confirmPassword') confirmPassword: string,
		@Arg('email') email: string,
		@Arg('dob') dob: number,
		@Arg('captcha') captcha: string,
		@Ctx() { res, prisma, mail }: { res: Response; prisma: PrismaClient, mail: Transporter<SMTPTransport.SentMessageInfo> }
	) {
		try {

			if(password !== confirmPassword){ // check if the password matches
				throw new Error('Passwords don\'t match!');
			}

			await verify(process.env.HCAPTCHA_SECRET as string, captcha) // verify the captcha token

			const newUser = await prisma.user.create({
				data: {
					username,
					password: await argon2.hash(password),
					email,
					discriminator: (Math.floor(Math.random() * (9999 - 1 + 1)) + 1).toString().padStart(4, '0'),
					dob: new Date(dob),
					registered: new Date(),
					lastLogin: new Date()
				}
			});

			const verificationToken = jsonwebtoken.sign(
				{id: newUser.id, email},
				process.env.JWT_SECRET as string,
				{ expiresIn: '5hr' }
			);


			await mail.sendMail({
				from: '"Screenhive No Reply" no-reply@screenhive.io',
				to: email,
				subject: "Please Verify Your Email!",
				html:`
				      <p>
						To Verify Your Account 
						<a href="https://screenhive.io/verify?=${verificationToken}">Click Here!</a>
					  </p>
					  <p>
					  	If that link doesn't work click here: https://screenhive.io/verify?=${verificationToken}
					  </p>
				    `
			})



			return !!newUser;
		} catch (err) {
			res.status(400);
			throw new Error(err);
		}
	}
}
