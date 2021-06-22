import { createServer, Server, Socket } from "net";
import { Service } from "typedi";
import { SioService } from "./sio";



@Service()
export class SocketService{

    private server : Server;

    constructor(private io: SioService){

        this.server = createServer();

        this.server.listen(9000, this.onStart.bind(this))
        this.server.on("connection", this.onConnection.bind(this))
        this.server.on("close", this.onClose.bind(this))
        this.server.on("error", this.onError.bind(this))
    }



    private onStart(){
        console.log("Starting streamer connection server")
    }

    private onConnection(socket: Socket){
        console.log("New streamer connection made")
        
    }

    private onClose(){
        console.log("Streamer connection lost")
    }

    private onError(){

    }


}