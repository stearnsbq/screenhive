import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { fromEvent, combineLatest, merge, zip } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { LoggingService } from './logging.service';
import { StorageService } from './storage.service';

@Injectable({
	providedIn: 'root'
})
export class WebsocketService {

	private socket : Socket

	constructor(private auth: AuthService, private storage: StorageService, private logging: LoggingService) {
	}

	public async connect(){


		if(await this.auth.isLoggedIn()){
			this.socket = new Socket({
				url: environment.socket,
				options: {
				  query: { token: this.storage.getItem("access_token") },
				  transports: ['websocket'],
				  upgrade: false,
				},
			  })
	
			
			this.socket.on('connect_failed', this.onConnectError.bind(this));
			this.socket.on('connect', this.onConnect.bind(this));
		}else{
			this.logging.error("Not logged in, cannot connect to the websocket server!")
		}


	}

	private onConnect() {
		this.logging.info('Connected to Websocket Server!');
	}

	private onConnectError(err: any) {
		this.logging.error(err);
	}

	public async videoAnswer(roomID:string, sdp: any){
		this.socket.emit('video-answer', {roomID, sdp});
	}

	public async iceCandidate(peer:string, roomID: string, candidate: any){
		this.socket.emit('user-ice-candidate', {peer, roomID, candidate});
	}

	public getRooms(page?: number, limit?: number, search?: string) {
		this.socket.emit('get-rooms', { page, limit, search });
	}

	public createRoom(name: string, password?: string) {
		this.socket.emit('create-room', {
			name,
			password,
			isPrivate: !!password
		});
	}

	public isRoomPrivate(roomID: string) {
		this.socket.emit('is-room-private', { roomID });
	}

	public joinRoom(roomID: string, password?: string) {
		this.socket.emit('join-room', { roomID, password });
	}

	public leaveRoom(roomID: string) {
		this.socket.emit('leave-room', { roomID });
	}

	public sendChat(roomID: string, message) {
		this.socket.emit('send-chat', { roomID, message });
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
