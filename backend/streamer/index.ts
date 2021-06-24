import { io } from "socket.io-client";
import {config} from 'dotenv';
import {createServer} from 'net';
import * as jwt from 'jsonwebtoken';

config();


try{

    const goSocketServer = createServer();

    const {roomID} = jwt.decode(process.env.STREAMER_TOKEN as string) as any;

    console.log(roomID)




    goSocketServer.on("connection", (socket) =>{

        const getData = () => new Promise((resolve, reject) => {

            socket.on("data", (data) => {
                resolve(data.toString())
            })

            socket.on("error", (err) => {
                reject(err)
            })

        }).finally(() => {
            socket.removeListener("data", () => {})
            socket.removeListener("error", () => {})
        }) 
    
        console.log("Go streamer connected!")
    
        const ws = io(process.env.WS_SERVER as string, {query:{
            token: process.env.STREAMER_TOKEN || ""
        }})
    
    
        ws.on("connect_error", (err) => {
            console.log(err)
        })
    
    
            
        ws.on("connect", async () => {
    
            console.log("Connected to websocket server!")
    
            socket.write(JSON.stringify({event: "start-webrtc"}) + "\n")

            const sdp = await getData() as string
    
            ws.emit("video-offer", {roomID, sdp})
    
        })
    



        ws.on("streamer-join-success", async () => {


            socket.write(JSON.stringify({event: "start-webrtc"}) + "\n")

            const sdp = JSON.parse(await getData() as string)

            ws.emit("video-offer", {roomID, sdp})
            
        })
    
    
        ws.on("video-answer", ({peer, sdp}) => {
            socket.write(JSON.stringify({event: "video-answer", peer, sdp}));
        })
    
        ws.on("ice-candidate", ({peer, candidate}) => {
            socket.write(JSON.stringify({event: "ice-candidate", peer, candidate}));
        })
    
    
        ws.on("error", ({data}) => {
    
        })

   
    
    })
    
    goSocketServer.on("close", () => {
    
    })
    
    goSocketServer.on("error", () => {
    
    })
    
    goSocketServer.listen(9000, () => {
        console.log("listening")
    })
    
    

}catch(err){
    console.log(err)
}

