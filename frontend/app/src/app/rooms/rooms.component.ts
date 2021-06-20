import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as Honeycomb from 'honeycomb-grid';
import * as svgjs from '@svgdotjs/svg.js';
import { WebsocketService } from '../websocket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggingService } from '../logging.service';
import { CreationDialogComponent } from './creation-dialog/creation-dialog.component';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements OnInit {
  @ViewChild("grid") grid: ElementRef;
  @ViewChild("creation")  creationDialog: CreationDialogComponent
  public rooms: {id: string, name: string, users: string[], isPrivate: boolean}[]
  public page: number;
  public total: number;

  constructor(private websocketService: WebsocketService, private router: Router, private logging: LoggingService, route:ActivatedRoute) { 
    this.page = 1;
    this.total = 0;
  }

  ngOnInit(){

    this.logging.debug("Retrieving Rooms")
    this.websocketService.getRooms(this.page, 16)

    this.websocketService.listenToEvent('rooms').subscribe(({rooms, total}) => {
      this.rooms = rooms;
      this.total = total;
    })

  }



  public joinRoom(room){
    this.logging.debug(`Trying to join room ${room.name} with id ${room.id}`)

    this.router.navigate(['/room', room.id]);
  }

}
