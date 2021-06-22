import { Service } from "typedi";
import { RedisService } from "./redis";
import jsonwebtoken, { decode } from 'jsonwebtoken';
import { createAdapter } from "socket.io-redis";
import * as io from "socket.io"

@Service()
export class SioService{

    private _io: io.Server;

    constructor(private redisService: RedisService){

        this._io = new io.Server(3000, {cors:{
            origin: "*"
        }});


        this._io.adapter(createAdapter({pubClient: redisService.pubClient, subClient: redisService.subClient}))


        this._io.use((socket: any, next: any) => {

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





    }


    get io(){
        return this._io;
    }



}