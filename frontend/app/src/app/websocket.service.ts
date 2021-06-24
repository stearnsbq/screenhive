import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { fromEvent, combineLatest, merge, zip } from 'rxjs';
import { LoggingService } from './logging.service';

@Injectable({
	providedIn: 'root'
})
export class WebsocketService {


	constructor(public socket: Socket, private logging: LoggingService) {
		this.socket.on('connect_failed', this.onConnectError.bind(this));
		this.socket.on('connect', this.onConnect.bind(this));
	}

	private onConnect() {
		this.logging.info('Connected to Websocket Server!');
	}

	private onConnectError(err: any) {
		this.logging.error(err);
	}

	public async videoAnswer(peer:string, sdp: any){
		this.socket.emit('video-answer', {peer, sdp});
	}

	public async iceCandidate(peer:string, roomID: string, candidate: any){
		this.socket.emit('user-ice-candidate', {peer, roomID, candidate});
	}


	public getRooms(page?: number, limit?: number, search?: string) {
		this.socket.emit('get-rooms', { page, limit, search });
		//return this.response('rooms');
	}

	public createRoom(name: string, password?: string) {
		this.socket.emit('create-room', {
			name,
			password,
			isPrivate: !!password
		});
		//return this.response('room-creation-success');
	}

	public isRoomPrivate(roomID: string) {
		this.socket.emit('is-room-private', { roomID });
		//return this.response('is-room-private-success');
	}

	public joinRoom(roomID: string, password?: string) {
		this.socket.emit('join-room', { roomID, password });
		
		//return this.response('room-join-success');
	}

	public leaveRoom(roomID: string) {
		this.socket.emit('leave-room', { roomID });
		//return this.response('room-left-success');
	}

	public sendChat(roomID: string, message) {
		this.socket.emit('send-chat', { roomID, message });
		//return this.response('chat-sent-success');
	}


	public listenToEventOnce(event: string){
		return this.socket.fromOneTimeEvent(event)
	}


	public listenToEvent(event: string){
		return this.socket.fromEvent(event)
	}

	public listenToEvents(events: string[]){
		return merge(
			...events.map((evt) => this.socket.fromEvent(evt))
		);
	}


}
