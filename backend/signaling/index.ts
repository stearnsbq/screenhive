import {Server} from 'ws'
import * as jwt from 'jsonwebtoken'
import { config } from 'dotenv';


const wss = new Server({port: 3001})

config();


const streamers = new Map<string, any>();
const users = new Map<string, any>();


wss.on('connection', (ws, req) => {

    const {searchParams} = new URL(req.url as string, "ws://x")

    const token = searchParams.get('token')


    if(!token){
        ws.send({"error": "Unauthorized"})
        return ws.close();
    }

    try{

        const user = jwt.verify(token, process.env.JWT_SECRET as string)







    }catch(err){
        ws.send({"error": "Unauthorized"})
        ws.close();
    }



})










