import 'reflect-metadata';
import {
	OnConnect,
	SocketController,
	ConnectedSocket,
	OnDisconnect,
	MessageBody,
	OnMessage,
	SocketIO
} from 'socket-controllers';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import sanitizeHtml from 'sanitize-html';
import { RedisService } from '../services/redis';
import { Service } from 'typedi';

export interface Room {
	name: string;
	isPrivate: boolean;
	password?: string;
	users: string[];
	streamer?: string;
	thumbnail?: string;
}

@Service()
@SocketController()
export class RoomController {
	constructor(private redisService: RedisService) {}

	@OnMessage('is-room-private')
	async onGetRoom(
		@ConnectedSocket() socket: any,
		@SocketIO() io: any,
		@MessageBody() { roomID }: { roomID: string }
	) {
		try {
			const lock = await this.redisService.lock(`rooms:${roomID}`, 1000);

			if (!await this.redisService.asyncHExists('rooms', roomID)) {
				return socket.emit('error', { err: 'Room Does Not Exist' });
			}

			const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as Room

			await lock.unlock();
			socket.emit('is-room-private-success', { isPrivate: room.isPrivate });
		} catch (err) {
			socket.emit('error', { err });
		}
	}

	@OnMessage('get-rooms')
	async onGetRooms(
		@ConnectedSocket() socket: any,
		@SocketIO() io: any,
		@MessageBody() { page = 1, limit = 16, query = '' }: { page: number; limit: number; query?: string }
	) {
		try {
			const rooms = Object.entries(await this.redisService.asyncGetAll('rooms')).map(([ id, obj ]) => {
				return { id, ...JSON.parse(obj as string) };
			});

			socket.emit('rooms', {
				rooms: rooms
					.filter((room) => (query.length > 0 ? room.name.includes(query) : true))
					.slice((page - 1) * limit, page * limit)
					.map(({ id, name, users, isPrivate, thumbnail }) => ({
						id,
						name,
						users: isPrivate ? [] : Array.from(users.keys()),
						isPrivate,
						thumbnail: (isPrivate ? '' : thumbnail) || ''
					})),
				total: rooms.length
			});
		} catch (err) {
			socket.emit('error', { err });
		}
	}

	@OnMessage('create-room')
	async onCreateRoom(
		@ConnectedSocket() socket: any,
		@MessageBody() { name, password, isPrivate }: { name: string; password?: string; isPrivate: boolean }
	) {
		try {
			const roomID = nanoid();

			if (isPrivate && !password) {
				return socket.emit('error', {
					err: 'Private rooms require a password!'
				});
			}

			await this.redisService.asyncHSet(
				'rooms',
				roomID,
				JSON.stringify({
					name,
					isPrivate,
					password: isPrivate && password ? await argon2.hash(password) : undefined,
					users: [],
					thumbnail: '',
					streamer: undefined
				})
			);

			socket.join(roomID);

			return socket.emit('room-creation-success', { roomID });
		} catch (err) {
			console.log(err);
			socket.emit('error', { err });
		}
	}

	@OnMessage('leave-room')
	async onLeaveRoom(@ConnectedSocket() socket: any, @MessageBody() { roomID }: { roomID: string }) {
		try {
			const lock = await this.redisService.lock(`rooms:${roomID}`, 1000);

			if (!await this.redisService.asyncHExists('rooms', roomID)) {
				return socket.emit('error', { err: 'Room Does Not Exist' });
			}

			const { username } = socket.user;

			const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as Room

			const idx = room.users.indexOf(username);

			if (idx === -1) {
				return socket.emit('error', { err: 'User is not in the room!' });
			}

			room.users.splice(idx, 1);

			socket.to(roomID).emit('user-left-room', { user: username });

			await this.redisService.asyncDel(`${username}-room`) 

			await this.redisService.asyncHSet('rooms', roomID, JSON.stringify(room));

			if (room.users.length <= 0) {
				await this.redisService.asyncSetEx(`rooms:${roomID}-expiry`, roomID, 10)

				const roomRemove = setInterval(async () => {

					if(!await this.redisService.asyncExists(`rooms:${roomID}-expiry`)){
						await this.redisService.asyncHDel("rooms", roomID);
						clearInterval(roomRemove)
					}

				}, 10000)
			}

			await lock.unlock();

			socket.emit('room-left-success', { roomID });
		} catch (err) {
			console.log(err)
			socket.emit('error', { err });
		}
	}


  @OnMessage('streamer-join')
  async onStreamerJoin(@ConnectedSocket() socket: any, @MessageBody() {streamer, roomID} : any){
    if(!socket.streamer || (socket.streamer && socket.streamer.roomID !== roomID) ){
      socket.emit("error", {err: "Unauthorized"})
    }

    try{

      const lock = await this.redisService.lock(`rooms:${roomID}`, 1000);

      if (!await this.redisService.asyncHExists('rooms', roomID)) {
				return socket.emit('error', { err: 'Room Does Not Exist' });
			}

      const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as Room


      room.streamer = socket.id;

      await this.redisService.asyncHSet('rooms', roomID, JSON.stringify(room));

      await lock.unlock();

      socket.emit("streamer-join-success");

    }catch(err){
      socket.emit("error", {err})
    }

  }

	@OnMessage('join-room')
	async onJoinRoom(
		@ConnectedSocket() socket: any,
		@MessageBody() { roomID, password }: { roomID: string; password?: string }
	) {
		try {
			const user = socket.user;

			const lock = await this.redisService.lock(`rooms:${roomID}`, 1000);

			if (!await this.redisService.asyncHExists('rooms', roomID)) {
				return socket.emit('error', { err: 'Room Does Not Exist' });
			}

			if(await this.redisService.asyncExists(`rooms:${roomID}-expiry`)){
				await this.redisService.asyncSet(`rooms:${roomID}-expiry`, roomID);
			}

			const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as Room

			if (room.isPrivate && !password) {
				return socket.emit('error', {
					err: 'Private rooms require a password!'
				});
			}

			if (room.isPrivate && !await argon2.verify(room.password as string, password as string)) {
				return socket.emit('error', { err: 'Invalid Password!' });
			}

			socket.join(roomID);


			await this.redisService.asyncSet(`${user.username}-room`, roomID) // to speed up when user leaves a room

			room.users.push(user.username);

			await this.redisService.asyncHSet('rooms', roomID, JSON.stringify(room));

			await lock.unlock();

			socket.to(roomID).emit('user-join-room', { username: user.username });

			socket.emit('room-join-success', {
				roomID,
				name: room.name,
				users: room.users.filter((usr) => usr !== user.username)
			});
		} catch (err) {
			socket.emit('error', { err });
		}
	}

	@OnMessage('send-emote')
	async onSendEmote(
		@ConnectedSocket() socket: any,
		@MessageBody() { roomID, emote }: { roomID: string; emote: string }
	) {}

	@OnMessage('send-chat')
	async onSendChat(
		@ConnectedSocket() socket: any,
		@MessageBody() { roomID, message }: { roomID: string; message: string }
	) {
		try {
			const lock = await this.redisService.lock(`rooms:${roomID}`, 1000);

			if (!await this.redisService.asyncHExists('rooms', roomID)) {
				return socket.emit('error', { err: 'Room does not exist!' });
			}

			const user = socket.user;

			const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as Room

			if (!room.users.includes(user.username)) {
				return socket.emit('error', { err: 'User is not in the room!' });
			}

			await lock.unlock();

			socket.to(roomID).emit('chat', {
				user: user.username,
				timestamp: Date.now(),
				message: sanitizeHtml(message, { allowedTags: [], allowedAttributes: {} })
			});

			socket.emit('chat-sent-success');
		} catch (err) {
			socket.emit('error', { err });
		}
	}


	@OnMessage("video-offer")
	async onVideoOffer(@ConnectedSocket() socket: any, @MessageBody() {roomID, sdp}: any){

		try{

			console.log(roomID, sdp)

			socket.to(roomID).emit("video-offer", {sdp})

		}catch(err){

			console.log(err)

		}

	}


	@OnConnect()
	connection(@ConnectedSocket() socket: any) {
		console.log('Client Connected');
	}

	@OnDisconnect()
	async disconnect(@ConnectedSocket() socket: any) {

		const {username} = socket.user;

		const key = `${username}-room`;

		if(await this.redisService.asyncExists(key)){

			const roomID = await this.redisService.asyncGet(key) as string

			const lock = await this.redisService.lock(`rooms:${roomID}`, 1000);

			if(await this.redisService.asyncHExists("rooms", roomID as string)){

				const room = JSON.parse(await this.redisService.asyncHGet("rooms", roomID)) as Room

				const idx = room.users.indexOf(username);

				if(idx !== -1){

					room.users.splice(room.users.indexOf(username), 1);

					await this.redisService.asyncHSet("rooms", roomID, JSON.stringify(room));
	
					await this.redisService.asyncDel(key)
	
					socket.to(roomID).emit('user-left-room', { user: username });
					
				}

			}


			await lock.unlock();

		}
		
		console.log('Client Disconnected');

	}
}
