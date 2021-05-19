import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as Honeycomb from 'honeycomb-grid';
import * as svgjs from '@svgdotjs/svg.js';
import { WebsocketService } from '../websocket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements AfterViewInit {
  @ViewChild("grid") grid: ElementRef;
  public rooms: {id: string, name: string, users: string[], isPrivate: boolean}[]

  constructor(private websocketService: WebsocketService, private router: Router) { }

  ngAfterViewInit(){
    this.websocketService.getRooms().then(({rooms}) => {
      this.rooms = rooms;
    })


  }
  
  public createRoom(){
    this.websocketService.createRoom("domey").then((result) => {
      console.log(result)

    })
  }

  public joinRoom(room){

    this.router.navigate(['/room', room.id]);
  }

}
