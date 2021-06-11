import 'reflect-metadata'
import { useSocketServer } from 'socket-controllers';
import { RoomController } from './controllers/RoomController';
import jsonwebtoken from 'jsonwebtoken';
import { config } from 'dotenv';
import { RedisClient } from 'redis';
import { createAdapter } from 'socket.io-redis';

config();


const pubClient = new RedisClient({host: process.env.REDIS_BACKEND as string, port: parseInt(process.env.REDIS_PORT as string)})
const subClient = pubClient.duplicate();

const io = require("socket.io")(3000, {cors:{
    origin: "*"
}});


io.use((socket: any, next: any) => {

    socket.redis = pubClient;
    
    if(socket.handshake.query && socket.handshake.query.token){
        
        jsonwebtoken.verify(socket.handshake.query.token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if(err) return next(new Error("UnAuthorized"))
            socket.user = decoded;
            next();
        })
        
    }else{
        next(new Error("Unauthorized"))
        socket.disconnect();
    }
})

io.adapter(createAdapter({pubClient, subClient}))

useSocketServer(io, {controllers: [RoomController]})


