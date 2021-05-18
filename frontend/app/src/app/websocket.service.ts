import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { fromEvent, merge } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  constructor(private socket: Socket) {
    this.socket.on("connect_failed", (err) => {
      console.log(err)
    })
  }

  private response(topic: string){
    return merge([this.socket.fromOneTimeEvent(topic), this.socket.fromOneTimeEvent("error")])
  }


  public getRooms(page?: number, search?: string) {
    this.socket.emit('get-rooms', { page, search });
    return this.response("rooms")
  }

  public createRoom(name: string, password?: string) {
    this.socket.emit('create-room', {
      name,
      password,
      isPrivate: !!password
    });
    return this.response("room-creation-success")
  }

  public joinRoom(roomID: string, password?: string) {
    this.socket.emit('join-room', { roomID, password });
    return this.response("room-join-success")
  }

  public leaveRoom(roomID: string){
    this.socket.emit("leave-room", {roomID})
    return this.response("room-left-success")
  }

  public sendChat(room: string, message) {
    this.socket.emit('send-chat', { room, message });
    return this.response("chat-sent-success")

  }

  public getRoomEvents(){
    return merge(["user-left-room", "user-join-room", "chat", "video-offer"].map((evt) => this.socket.fromEvent(evt)))
  }


}
