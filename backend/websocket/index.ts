import 'reflect-metadata'
import { useSocketServer } from 'socket-controllers';
import { RoomController } from './controllers/RoomController';
import jsonwebtoken from 'jsonwebtoken';
import { config } from 'dotenv';
import { RedisClient } from 'redis';
import { createAdapter } from 'socket.io-redis';
import Container from 'typedi';
import { RedisService } from './services/redis';

config();


const io = require("socket.io")(3000, {cors:{
    origin: "*"
}});


io.use((socket: any, next: any) => {

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


const redisService = Container.get(RedisService);

io.adapter(createAdapter({pubClient: redisService.pubClient, subClient: redisService.subClient}))

useSocketServer(io, {controllers: [RoomController]})


