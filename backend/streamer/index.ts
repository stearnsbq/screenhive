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

        console.log("Go streamer connected!")
    
        const ws = io(process.env.WS_SERVER as string, {query:{
            token: process.env.STREAMER_TOKEN || ""
        }})


        socket.on("data", (socketData) => {

           const {event, data} = JSON.parse(socketData.toString())

    
           switch(event){
            case "video-offer":{
                ws.emit("video-offer", {roomID, sdp: data.sdp, peer: data.peer})
                break;
            }
            case "streamer-ice-candidate":{
                ws.emit("streamer-ice-candidate", {roomID, peer: data.peer, candidate: data.candidate})
                break;
            }
           }

        })

        socket.on("error", (err) => {
            
        })
    
    
        ws.on("connect_error", (err) => {
            console.log(err)
        })
    

        ws.on("connect", async () => {
    
            console.log("Connected to websocket server!")
    

            ws.emit("streamer-join", {roomID})
    
        })
    

        ws.on("streamer-join-success", async ({peers}) => {

            console.log(peers)

            socket.write(JSON.stringify({event: "start-webrtc", data: {peers}}) + "\n")

        })

        ws.on("user-join-room", async ({peer}) => {

            socket.write(JSON.stringify({event: "user-join-room", data: {peer}}) + "\n")

        })
    
    
        ws.on("video-answer", ({peer, sdp}) => {
            socket.write(JSON.stringify({event: "video-answer", data: {peer, sdp}}) + "\n");
        })
    
        ws.on("user-ice-candidate", ({peer, candidate}) => {
            socket.write(JSON.stringify({event: "user-ice-candidate", data: {peer, candidate}}) + "\n");
        })
    
    
        ws.on("error", ({data}) => {
            console.log(data)
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

