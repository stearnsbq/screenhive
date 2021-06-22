import WebSocket, { Server } from 'ws';
import * as jwt from 'jsonwebtoken';
import { config } from 'dotenv';

const wss = new Server({ port: 3001 });

config();

const streamers = new Map<string, WebSocket>();
const users = new Map<string, WebSocket>();

wss.on('connection', (ws, req) => {
	const { searchParams } = new URL(req.url as string, 'ws://x');

	const token = searchParams.get('token');

	if (!token) {
		ws.send({ error: 'Unauthorized' });
		return ws.close();
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

		decoded.streamer ? streamers.set(decoded.streamer, ws) : users.set(decoded.username, ws);

		ws.on(
			'message',
			({
				event,
				room,
				target,
				data
			}: {
				event: string;
				room: string;
				target: string;
				data: { sdp?: string; candidate?: string };
			}) => {
				switch (event) {
                    case 'get-video-offer': {
						if (!decoded.username) {
							ws.send({ error: 'Unauthorized' });
						}

						const streamer = streamers.get(target) as WebSocket;

						streamer.send({ event: 'get-video-offer', user: decoded.username });

						break;
					}
					case 'video-offer': {
						if (!decoded.streamer) {
							ws.send({ error: 'Unauthorized' });
						}

						const user = users.get(target) as WebSocket;

						user.send({ event: 'video-offer', data });

						break;
					}
					case 'video-answer': {
						if (!decoded.username) {
							ws.send({ error: 'Unauthorized' });
						}

						const streamer = streamers.get(target) as WebSocket;

						streamer.send({ event: 'video-answer', data });

						break;
					}
					case 'ice-candidate': {
						if (decoded.username) {
							const streamer = streamers.get(target) as WebSocket;

							streamer.send({ event: 'ice-candidate', data });
						} else if (decoded.streamer) {
							const user = users.get(target) as WebSocket;

							user.send({ event: 'ice-candidate', data });
						} else {
							ws.send({ error: 'Unauthorized' });
						}

						break;
					}
				}
			}
		);

		ws.on('error', (data) => {});

		ws.on('close', (data) => {
			decoded.streamer ? streamers.delete(decoded.streamer) : users.delete(decoded.username);
		});
	} catch (err) {
		ws.send({ error: 'Unauthorized' });
		ws.close();
	}
});
