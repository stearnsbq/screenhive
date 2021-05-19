import { Prisma, PrismaClient } from '@prisma/client';
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

export interface Room {
	name: string;
	users: Map<string, any>;
	streamer?: any;
	isPrivate: boolean;
	messages: { user: string; timestamp: number; message: string }[];
	password?: string;
	thumbnail?: string;
}

@SocketController()
export class RoomController {
	private rooms: Map<string, Room>;
	private roomsMutex: Mutex;

	constructor() {
		this.rooms = new Map();
		this.roomsMutex = new Mutex();
	}

	@OnMessage('get-rooms')
	async onGetRooms(
		@ConnectedSocket() socket: any,
		@SocketIO() io: any,
		@MessageBody() { page = 1, limit = 25, query = '' }: { page: number; limit: number; query?: string }
	) {
		try {
			await this.roomsMutex.runExclusive(async () => {
				const rooms = Array.from(this.rooms.values()).slice((page - 1) * limit, page * limit - 1);

				const availableRooms = rooms.filter((room) => {
					if (query.length > 0) {
						return !room.isPrivate && room.name.includes(query);
					}

					return !room.isPrivate;
				});

				socket.emit('rooms', {
					rooms: availableRooms.map(({ name, users, isPrivate, thumbnail }) => ({
						name,
						users: Array.from(users.keys()),
						isPrivate,
						thumbnail
					}))
				});
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
			const roomID = uuidv4();

			if (isPrivate && !password) {
				return socket.emit('error', { err: 'Private rooms require a password!' });
			}

			await this.roomsMutex.runExclusive(async () => {
				this.rooms.set(roomID, {
					name,
					isPrivate,
					password: password ? await argon2.hash(password) : undefined,
					users: new Map(),
					messages: []
				});
			});

			socket.emit('room-creation-success', { roomID });
		} catch (err) {
			socket.emit('error', { err });
		}
	}

	@OnMessage('leave-room')
	async onLeaveRoom(@ConnectedSocket() socket: any, @MessageBody() { roomID }: { roomID: string }) {
		try {
			await this.roomsMutex.runExclusive(async () => {
				if (!this.rooms.has(roomID)) {
					return socket.emit('error', { err: 'Room Does Not Exist' });
				}

				const room = (await this.rooms.get(roomID)) as Room;

				const { username } = socket.user;

				if (!room.users.has(username)) {
					return socket.emit('error', { err: 'User is not in the room!' });
				}

				if (!room.users.delete(username)) {
					return socket.emit('error', { err: 'Failed to remove user from room!' });
				}

				room.users.forEach((socket, user) => {
					socket.emit('user-left-room', { user: username });
				});

				if (room.users.size <= 0) {
					await this.rooms.delete(roomID);
				}
			});

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

			await this.roomsMutex.runExclusive(async () => {
				if (!await this.rooms.has(roomID)) {
					return socket.emit('error', { err: 'Room Does Not Exist' });
				}

				const room = (await this.rooms.get(roomID)) as Room;

				if (room.isPrivate && !password) {
					return socket.emit('error', { err: 'Private rooms require a password!' });
				}

				if (room.isPrivate && !await argon2.verify(room.password as string, password as string)) {
					return socket.emit('error', { err: 'Invalid Password!' });
				}

				room.users.forEach((socket, username) => {
					socket.emit('user-join-room', { username });
				});

				room.users.set(user.username, socket);

				socket.emit('room-join-success', { roomID, users: [ ...room.users.keys() ] });
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
			await this.roomsMutex.runExclusive(() => {
				if (!this.rooms.has(roomID)) {
					console.log('roomID');
					return socket.emit('error', { err: 'Room does not exist!' });
				}

				const user = socket.user;

				const room = this.rooms.get(roomID) as Room;

				if (!room.users.has(user.username)) {
					return socket.emit('error', { err: 'User is not in the room!' });
				}

				const newMessage = { user: user.username, timestamp: Date.now(), message };

				room.messages.push(newMessage);

				room.users.forEach((socket, username) => {
					socket.emit('chat', newMessage);
				});
			});

			socket.emit('chat-sent-success');
		} catch (err) {
			socket.emit('error', { err });
		}
	}

	@OnMessage('streamer-join')
	onStreamerJoin(@ConnectedSocket() socket: any, @MessageBody() { roomID, sdp }: { roomID: string; sdp: string }) {
		try {
			if (!socket.streamer) {
				return socket.emit('error', { err: 'You are not a streamer!' });
			}

			this.roomsMutex.runExclusive(() => {
				if (!this.rooms.has(roomID)) {
					return socket.emit('error', { err: 'Room does not exist!' });
				}

				const streamer = socket.streamer;

				const room = this.rooms.get(roomID) as Room;

				room.streamer = { streamer, socket };

				room.users.forEach((socket, username) => {
					socket.emit('video-offer', { sdp });
				});
			});

			socket.emit('video-offers-success');
		} catch (err) {
			socket.emit('error', { err });
		}
	}

	@OnMessage('video-answer')
	public onVideoAnswer(
		@ConnectedSocket() socket: any,
		@MessageBody() { roomID, sdp }: { roomID: string; sdp: string }
	) {
		try {
			this.roomsMutex.runExclusive(() => {
				if (!this.rooms.has(roomID)) {
					return socket.emit('error', { err: 'Room does not exist!' });
				}

				const user = socket.user;

				const { streamer } = this.rooms.get(roomID) as Room;

				streamer.socket.emit('video-answer', { peer: user.username, sdp });
			});

			socket.emit('video-answer-success');
		} catch (err) {
			socket.emit('error', { err });
		}
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
