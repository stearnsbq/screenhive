import { createServer, Server, Socket } from "net";
import { Service } from "typedi";
import { SioService } from "./sio";
import * as jwt from 'jsonwebtoken'
import { any } from "bluebird";


@Service()
export class SocketService{

    private server : Server;

    private streamers: Map<string, Socket>;

    constructor(private io: SioService){

        this.streamers = new Map();

        this.server = createServer();

        this.server.listen(9000, this.onStart.bind(this))
        this.server.on("connection", this.onConnection.bind(this))
        this.server.on("close", this.onClose.bind(this))
        this.server.on("error", this.onError.bind(this))
    }


    public send(roomID: string, data: any){
        
        if(this.streamers.has(roomID)){
            const streamerSocket = this.streamers.get(roomID);
            streamerSocket?.write(JSON.stringify(data));
        }

        
    }


    private onStart(){
        console.log("Starting streamer connection server")
    }

    private onConnection(socket: Socket){
        console.log("New streamer connection made")

        socket.on("data", async (data) => {

            const json = JSON.parse(data.toString()) as {event: string, data?: any}

            switch(json.event){
                case 'register':{

                    try{
                        const token = json.data;

                        const {roomID} = jwt.verify(token, process.env.JWT_SECRET as string) as {roomID: string}
    
                        this.streamers.set(roomID, socket);
    
                        (socket as any).roomID = roomID;
    
                        socket.write(JSON.stringify({event: "registered"}))
                    }catch(err){
                        socket.write(JSON.stringify({event: "error", data: err}))
                    }


                    break;
                }
                case 'video-offer':{

                    try{

                        const {roomID} = (socket as any);

                        if(!roomID || !this.streamers.has(roomID) ){
                            return socket.write(JSON.stringify({event: "error", data: "Not Registered!"}))
                        }
    
                        const sdp = json.data;
    
                        this.io.to(roomID).emit("video-offer", {sdp})
    
                        socket.write(JSON.stringify({event: "video-offer-success"}))

                    }catch(err){
                        return socket.write(JSON.stringify({event: "error", data: err}))
                    }


                    break;
                }
                case 'ice-candidate':{

                    const {roomID} = (socket as any);

                    if(!roomID || !this.streamers.has(roomID) ){
                        return socket.write(JSON.stringify({event: "error", data: "Not Registered!"}))
                    }

                    const {candidate, user} = json.data;

                    const sockets =  (await this.io.of("rooms").adapter.sockets(new Set([roomID])))

                    if(!sockets.has(user)){
                        return socket.write(JSON.stringify({event: "error", data: "User is not in the room!"}))
                    }


                    this.io.to(user).emit("ice-candidate", {candidate})
                }

            }

        })











    }

    private onClose(){
        console.log("Streamer connection lost")
    }

    private onError(){

    }


}