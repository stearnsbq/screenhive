import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggingService } from '../logging.service';
import { CreationDialogComponent } from './creation-dialog/creation-dialog.component';
import { HeaderService } from '../header.service';

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
  public rooms: Room[]
  public page: number;
  public total: number;


  constructor(private websocketService: WebsocketService, private router: Router, private logging: LoggingService, private headerService: HeaderService) { 
    this.page = 1;
    this.total = 0;
  }

  async ngOnInit(){

    

    await this.websocketService.connect()

    this.logging.info("Connected to Websocket Server!")

    this.logging.info("Retrieving Rooms")

    this.websocketService.getRooms(this.page, 16)

    this.websocketService.listenToEvent('rooms').subscribe(({rooms, total}) => {
      this.rooms = rooms;
      this.total = total;
    })

    this.headerService.searchSubject.subscribe(query => {
      this.websocketService.getRooms(this.page, 16, query)
    })

  }



  public joinRoom(room){
    this.logging.debug(`Trying to join room ${room.name} with id ${room.id}`)

    this.router.navigate(['/room', room.id]);
  }

}
