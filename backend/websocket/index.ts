import 'reflect-metadata'
import { useContainer, useSocketServer } from 'socket-controllers';
import { RoomController } from './controllers/RoomController';
import jsonwebtoken, { decode } from 'jsonwebtoken';
import { config } from 'dotenv';
import { createAdapter } from 'socket.io-redis';
import Container from 'typedi';
import { RedisService } from './services/redis';

config();


const io = require("socket.io")(3000, {cors:{
    origin: "*"
}});


const redisService = Container.get(RedisService);

io.adapter(createAdapter({pubClient: redisService.pubClient, subClient: redisService.subClient}))


io.use((socket: any, next: any) => {

    if(socket.handshake.query && socket.handshake.query.token){
        
        jsonwebtoken.verify(socket.handshake.query.token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if(err) return next(new Error("UnAuthorized"))


            if(decoded.streamer){
                socket.streamer = decoded;
                return next();
            }


            socket.user = decoded;

            next();
        })
        
    }else{
        next(new Error("Unauthorized"))
        socket.disconnect();
    }
})


useContainer(Container)

useSocketServer(io, {controllers: [RoomController]})


