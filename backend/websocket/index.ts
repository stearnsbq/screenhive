import 'reflect-metadata'
import { useContainer, useSocketServer } from 'socket-controllers';
import { RoomController } from './controllers/RoomController';
import { config } from 'dotenv';
import { createAdapter } from 'socket.io-redis';
import Container from 'typedi';
import { SioService } from './services/sio';

config();


useContainer(Container)

const ioService = Container.get(SioService)


useSocketServer(ioService.io, {controllers: [RoomController]})


