import { ConnectedSocket, MessageBody, OnMessage, SocketController, SocketIO } from "socket-controllers";
import { Service } from "typedi";
import { RedisService } from "../services/redis";
import { SocketService } from "../services/socket";



@Service()
@SocketController("signaling")
export class SignalingController {


    constructor(private socketService: SocketService, private redisService: RedisService){

    }


    @OnMessage("ice-candidate")
    async onIceCandidate(@ConnectedSocket() socket: any, @MessageBody() {roomID, candidate}: any, @SocketIO() io: any){
        try{

            if (!await this.redisService.asyncHExists('rooms', roomID)) {
				return socket.emit('error', { err: 'Room Does Not Exist' });
			}

        }catch(err){

        }
    }


    @OnMessage("video-answer")
    onVideoAnswer(@ConnectedSocket() socket: any, @MessageBody() {roomID, sdp}: any, @SocketIO() io: any){
        try{

        }catch(err){

        }
    }

    
}