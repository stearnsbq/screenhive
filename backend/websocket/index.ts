import 'reflect-metadata'
import { useSocketServer } from 'socket-controllers';
import { RoomController } from './controllers/RoomController';
import jsonwebtoken from 'jsonwebtoken';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client'

config();

const io = require("socket.io")(3000, {cors:{
    origin: "*"
}});


io.prisma = new PrismaClient();

// io.use((socket: any, next: any) => {
//     if(socket.handshake.query && socket.handshake.query.token){

//         jsonwebtoken.verify(socket.handshake.query.token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
//             if(err) return next(new Error("UnAuthorized"))
//             socket.user = decoded;
//             next();
//         })
//     }else{
//         next(new Error("UnAuthorized"))
//     }
// })

useSocketServer(io, {controllers: [RoomController]})


