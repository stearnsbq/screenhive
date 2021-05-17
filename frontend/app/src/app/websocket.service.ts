import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { fromEvent, merge } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  constructor(private socket: Socket) {}

  public getRooms(page?: number, search?: string) {
    this.socket.emit('get-rooms', { page, search });
  }

  public createRoom(name: string, password?: string) {
    this.socket.emit('create-room', {
      name,
      password,
      isPrivate: password ? true : false,
    });
  }

  public joinRoom(room: string, password?: string) {
    this.socket.emit('join-room', { room, password });
  }

  public sendChat(room: string, message) {
    this.socket.emit('send-chat', { room, message });
  }

  public getErrors() {
    return this.socket.fromEvent('error');
  }


  public getRoomEvents(){
    return merge(["user-left-room", "user-join-room", "room-join-success", "chat", "video-offer", "room-left-success"].map((evt) => this.socket.fromEvent(evt)))
  }


}
