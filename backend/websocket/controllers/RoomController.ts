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
import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2';
import { Mutex } from 'async-mutex';
import { nanoid } from 'nanoid';
import sanitizeHtml from 'sanitize-html';
import { RedisClient } from 'redis';
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual, verify } from 'node:crypto';
import { RedisService } from '../services/redis';
import { promisify } from 'util';
import { Inject, Service } from 'typedi';

export interface Room {
	id: string;
	name: string;
	owner: string;
	users: Map<string, any>;
	streamer?: any;
	isPrivate: boolean;
	messages: { user: string; timestamp: number; message: string }[];
	password?: string;
	thumbnail?: string;
	timeout?: any;
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

			const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as {
				name: string;
				isPrivate: boolean;
				password?: string;
				users: string[];
				streamer: string;
			};

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
				return { id, ...JSON.parse(obj) };
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

			const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as {
				name: string;
				isPrivate: boolean;
				password?: string;
				users: string[];
				streamer: string;
			};

			const idx = room.users.indexOf(username);

			if (idx === -1) {
				return socket.emit('error', { err: 'User is not in the room!' });
			}

			room.users.splice(idx, 1);

			socket.to(roomID).emit('user-left-room', { user: username });

			await this.redisService.asyncHSet('rooms', roomID, JSON.stringify(room));

			// 	Handling users leaving the room

			// 	Case 1: All users leave the room
			// 		Result: Set a timer for 10 seconds and if a person joins again stop the timer otherwise just delete the room and notify to shutdown streamer
			// 	Case 2: A user joins before the timer expires
			// 		Result: Stop the timer and keep the room open
			// 	Case 3: Owner closes the room
			// 		Result: kick everyone out, delete the room and notify the streamer

			// */

			// 		if (room.users.size <= 0) {
			// 			room.timeout = setTimeout(() => {
			// 				this.rooms.delete(roomID);
			// 			}, 10000);
			// 		}
			// 	});
			await lock.unlock();

			socket.emit('room-left-success', { roomID });
		} catch (err) {
			socket.emit('error', { err });
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

			const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as {
				name: string;
				isPrivate: boolean;
				password?: string;
				users: string[];
				streamer: string;
			};

			if (room.isPrivate && !password) {
				return socket.emit('error', {
					err: 'Private rooms require a password!'
				});
			}

			if (room.isPrivate && !await argon2.verify(room.password as string, password as string)) {
				return socket.emit('error', { err: 'Invalid Password!' });
			}

			socket.join(roomID);

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

			const room = JSON.parse((await this.redisService.asyncHGet('rooms', roomID)) as string) as {
				name: string;
				isPrivate: boolean;
				password?: string;
				users: string[];
				streamer?: string;
			};

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

	@OnMessage('streamer-join')
	async onStreamerJoin(
		@ConnectedSocket() socket: any,
		@MessageBody() { roomID, sdp }: { roomID: string; sdp: string }
	) {
		try {
			if (!socket.streamer) {
				return socket.emit('error', { err: 'You are not a streamer!' });
			}

			const lock = await this.redisService.lock(`rooms:${roomID}`, 1000);

			if (!await this.redisService.asyncExists(roomID)) {
				return socket.emit('error', { err: 'Room does not exist!' });
			}

			const room = JSON.parse((await this.redisService.asyncGet(roomID)) as string) as {
				name: string;
				isPrivate: boolean;
				password?: string;
				users: string[];
				streamer?: string;
			};

			room.streamer = socket.id;

			await this.redisService.asyncHSet("rooms", roomID, JSON.stringify(room));

			await lock.unlock();

			socket.to(roomID).emit('video-offer', { sdp });

			socket.emit('video-offers-success');
		} catch (err) {
			socket.emit('error', { err });
		}
	}

	@OnMessage('video-answer')
	public async onVideoAnswer(
		@ConnectedSocket() socket: any,
		@MessageBody() { roomID, sdp }: { roomID: string; sdp: string }
	) {
		try {
			const user = socket.user;

			const lock = await this.redisService.lock(`rooms:${roomID}`, 1000);

			if (!await this.redisService.asyncHExists("rooms", roomID)) {
				return socket.emit('error', { err: 'Room does not exist!' });
			}

			const room = JSON.parse((await this.redisService.asyncHGet("rooms", roomID)) as string) as {
				name: string;
				isPrivate: boolean;
				password?: string;
				users: string[];
				streamer?: string;
			};

			if (!room.users.includes(user.username)) {
				return socket.emit('error', { err: 'User is not in the room!' });
			}

			await lock.unlock();

			socket.to(room.streamer).emit('video-answer', { peer: user.username, sdp });

			socket.emit('video-answer-success');
		} catch (err) {
			socket.emit('error', { err });
		}
	}

	@OnConnect()
	connection(@ConnectedSocket() socket: any) {
		console.log('Client Connected');
	}

	@OnDisconnect()
	disconnect(@ConnectedSocket() socket: any) {
		console.log('Client Disconnected');
	}
}
