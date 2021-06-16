import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { LoggingService } from '../logging.service';
import { StorageService } from '../storage.service';
import { WebsocketService } from '../websocket.service';
import { PasswordDialogComponent } from './password-dialog/password-dialog.component';

enum MessageType {
  Chat = 1,
  Event = 2,
}

interface Room {
  name?: string;
  users?: string[];
  password?: string;
  messages?: {
    type: MessageType;
    user: string;
    timestamp: number;
    message: string;
  }[];
}

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild('player') player: ElementRef;
  @ViewChild('roomPasswordInput') roomPasswordInput: ElementRef;
  @ViewChild('passwordDialog') passwordDialog: PasswordDialogComponent;
  public chatExpanded: boolean;
  public playerVolume: number;
  public muted: boolean;
  public roomID: string;
  public room: Room;

  public isPasswordDialogOpen: boolean;

  constructor(
    private auth: AuthService,
    private socketService: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private logging: LoggingService,
    private storage: StorageService
  ) {
    this.chatExpanded = false;
    this.muted = false;
    this.playerVolume = 0.0;
    this.isPasswordDialogOpen = false;


  }


  ngOnDestroy(){
    if(this.room){
      this.socketService.leaveRoom(this.roomID).then((val) => {
        this.logging.debug(`Left Room ${this.room.name} with id ${this.roomID}`)
        this.storage.removeItem("roomPassword")
      })
    }
  }

   public async joinRoom(roomID: string, password?: string){
    this.room = await this.socketService.joinRoom(roomID, password)

    this.room.messages = [{
      type: MessageType.Event,
      user: "You",
      timestamp: Date.now(),
      message: "You joined",
    }];
  }

  ngOnInit() {

    this.socketService.getRoomEvents().subscribe((evt) => {
      console.log(evt)
    })

    this.route.params.subscribe(async ({ id }) => {
      this.roomID = id;

      try{

        const {isPrivate} = await this.socketService.isRoomPrivate(this.roomID) as {isPrivate: boolean};


        if(isPrivate){


          if(this.storage.hasItem("roomPassword")){
            this.joinRoom(this.roomID, this.storage.getItem("roomPassword"))
            return;
          }

          this.passwordDialog.open().subscribe(async (password) => {

            try{

              this.joinRoom(this.roomID, password)

              this.passwordDialog.close();

              this.storage.setItem("roomPassword", password);


            }catch(err){
                this.passwordDialog.error(err);
            }

          })

          return;
        }
        

        await this.joinRoom(this.roomID)
        
  
      }catch(err){
        this.router.navigate(['/']);
        console.log(err);
      }


    });
  }

  onVolumeChange() {
    this.player.nativeElement.volume = this.playerVolume;
    this.muted = false;
  }

  mute() {
    this.player.nativeElement.volume = 0;
    this.muted = true;
  }

  unmute() {
    if (this.muted) {
      this.player.nativeElement.volume = this.playerVolume;
      this.muted = false;
    }
  }

  sendChat(target) {
    const { username } = this.auth.user();

    const escaped = target.value.replace(/\n/ig, '');

    this.socketService
      .sendChat(this.roomID, escaped)
      .then((message) => {
        this.room.messages.push({
          type: MessageType.Chat,
          user: username,
          timestamp: Date.now(),
          message: escaped,
        });
        target.value = '';
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
