import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as Honeycomb from 'honeycomb-grid';
import * as svgjs from '@svgdotjs/svg.js';
import { WebsocketService } from '../websocket.service';
import { Router } from '@angular/router';
import { LoggingService } from '../logging.service';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements AfterViewInit {
  @ViewChild("grid") grid: ElementRef;
  public rooms: {id: string, name: string, users: string[], isPrivate: boolean}[]
  public page: number;
  public isRoomCreationOpen: boolean;

  constructor(private websocketService: WebsocketService, private router: Router, private logging: LoggingService) { 
    this.page = 1;
    this.isRoomCreationOpen = false;
  }

  ngAfterViewInit(){
    this.logging.debug("Retrieving Rooms")
    this.websocketService.getRooms(this.page, 16).then(({rooms}) => {
      this.rooms = rooms;
      
    })


  }
  
  public createRoom(){
    this.websocketService.createRoom("<h1>dome</h1>").then((result) => {
      console.log(result)
    })
  }

  public joinRoom(room){
    this.logging.debug(`Trying to join room ${room.name} with id ${room.id}`)
    this.router.navigate(['/room', room.id]);
  }

}
