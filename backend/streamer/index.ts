import { io } from 'socket.io-client';
import { config } from 'dotenv';
import { createServer } from 'net';
import * as jwt from 'jsonwebtoken';
import { spawn } from 'child_process';
import { exit } from 'process';

config();

try {


    if(!process.env.STREAMER_TOKEN || !process.env.WS_SERVER){
        console.log("MISSING ENV FILE!")
        exit(1)
    }




	const goSocketServer = createServer();

	const { roomID } = jwt.decode(process.env.STREAMER_TOKEN as string) as any;

	goSocketServer.on('connection', (socket) => {
		console.log('Go streamer connected!');

		const ws = io(process.env.WS_SERVER as string, {
			query: {
				token: process.env.STREAMER_TOKEN as string
			}
		});

		socket.on('data', (socketData) => {
			const { event, data } = JSON.parse(socketData.toString());

			switch (event) {
				case 'video-offer': {
					ws.emit('video-offer', { roomID, sdp: data.sdp, peer: data.peer });
					break;
				}
				case 'streamer-ice-candidate': {
					ws.emit('streamer-ice-candidate', { roomID, peer: data.peer, candidate: data.candidate });
					break;
				}
				case 'error': {
					ws.emit('error', { err: data.err });
				}
			}
		});

		socket.on('error', (err) => {
			ws.emit('error', { err });
		});

		ws.on('connect_error', (err) => {
			console.log(err);
		});

		ws.on('connect', async () => {
			console.log('Connected to websocket server!');

			ws.emit('streamer-join', { roomID });
		});

		ws.on('streamer-join-success', async ({ peers }) => {
			socket.write(JSON.stringify({ event: 'start-webrtc', data: { peers } }) + '\n');
		});

		ws.on('user-join-room', async ({ peer }) => {
			socket.write(JSON.stringify({ event: 'user-join-room', data: { peer } }) + '\n');
		});

		ws.on('video-answer', ({ peer, sdp }) => {
			socket.write(JSON.stringify({ event: 'video-answer', data: { peer, sdp } }) + '\n');
		});

		ws.on('user-ice-candidate', ({ peer, candidate }) => {
			socket.write(JSON.stringify({ event: 'user-ice-candidate', data: { peer, candidate } }) + '\n');
		});

		ws.on('error', ({ data }) => {
			console.log(data);
		});
	});

	goSocketServer.on('close', () => {
        console.log("closed")
    });

	goSocketServer.on('error', () => {
        console.log("error")
    });

	goSocketServer.listen(9000, () => {
		console.log('listening');
	});


    const go = spawn("go run main.go", {shell: true})

} catch (err) {
	console.log(err);
}
