import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as Honeycomb from 'honeycomb-grid';
import * as svgjs from '@svgdotjs/svg.js';
import { WebsocketService } from '../websocket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggingService } from '../logging.service';
import { CreationDialogComponent } from './creation-dialog/creation-dialog.component';

enum Presence {
  "Online" = 0,
  "Offline" = 1,
  "Away" = 2,
  "Do Not Disturb" = 3
}

interface Friend{
  name: string;
  discriminator: number;
  avatar: string;
  presence: Presence
}

interface Room{
  id: string, 
  name: string, 
  users: string[], 
  isPrivate: boolean
}


@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements OnInit {
  @ViewChild("grid") grid: ElementRef;
  @ViewChild("creation")  creationDialog: CreationDialogComponent
  public friends: Friend[];
  public rooms: Room[]
  public page: number;
  public total: number;

  public Presence = Presence

  constructor(private websocketService: WebsocketService, private router: Router, private logging: LoggingService, route:ActivatedRoute) { 
    this.page = 1;
    this.total = 0;
    this.friends = [{name: "realfrogg", discriminator: 3312, avatar: "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/b6b7365f2b7ed236378a9c93753afc61~c5_720x720.jpeg?x-expires=1625173200&x-signature=bxAG%2F5isfKZZW40RACdpPbjKfSM%3D", presence: 0}]
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
