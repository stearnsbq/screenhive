import {
    OnConnect,
    SocketController,
    ConnectedSocket,
    OnDisconnect,
    MessageBody,
    OnMessage,
    SocketIO,
  } from 'socket-controllers';
  import { v4 as uuidv4 } from 'uuid';

@SocketController()
export class RoomController {

  constructor(){

  }



  @OnMessage("getRooms")
  onGetRooms(@SocketIO() io: any){

  }


  @OnMessage("createRoom")
  onCreateRoom(@SocketIO() io: any, @ConnectedSocket() socket: any, @MessageBody() message: {roomID: string, password?:string}){

    




  }


  @OnMessage("joinRoom")
  onJoinRoom(@SocketIO() io: any, @MessageBody() message: {roomID: string, password?:string}){

  }

  @OnMessage("chat")
  onChat(@SocketIO() io: any, @MessageBody() message: any){

  }

  @OnConnect()
  connection(@ConnectedSocket() socket: any) {
    console.log('client connected');
  }
  
  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: any) {
    console.log('client disconnected');
  }
  
}