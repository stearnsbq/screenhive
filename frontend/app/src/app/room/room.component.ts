import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
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
  YouJoined = 2,
  UserJoined = 3,
  UserLeft = 4,
}

interface Room {
  name?: string;
  users?: string[];
  password?: string;
  messages?: {
    type: MessageType;
    user?: string;
    timestamp?: number;
    message?: string;
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
  public MessageType = MessageType

  public isPasswordDialogOpen: boolean;

  constructor(
    private auth: AuthService,
    private socketService: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private logging: LoggingService,
    private storage: StorageService
  ) {
    this.chatExpanded = true;
    this.muted = false;
    this.playerVolume = 0.0;
    this.isPasswordDialogOpen = false;
  }


  ngOnDestroy(){
    if(this.room){
      this.logging.info(`Trying to Leave Room ${this.roomID}`)

      this.socketService.leaveRoom(this.roomID)

      this.socketService.listenToEventOnce('error').then(({error}) => {
        this.logging.error(JSON.stringify(error))
      })

      this.socketService.listenToEventOnce('room-left-success').then((evt) => {
        this.logging.debug(`Left Room ${this.room.name} with id ${this.roomID}`)
        this.storage.removeItem("roomPassword")
      })

    }
  }

   public async joinRoom(roomID: string, password?: string){
    try{

      this.socketService.joinRoom(roomID, password)

      this.room = await this.socketService.listenToEventOnce('room-join-success')

      this.room.messages = [{
        type: MessageType.YouJoined,
        user: "You",
        timestamp: Date.now(),
        message: "You joined",
      }];

      const { username } = this.auth.user();

      this.room.messages.push({
        type: MessageType.Chat,
        user: username,
        timestamp: Date.now(),
        message: "test123",
      });

    }catch(err){
      this.logging.error(JSON.stringify(err))
    }

  }

  ngOnInit() {


    this.socketService.listenToEvent('user-left-room').subscribe(({user}) => {

        this.room.users.splice(this.room.users.indexOf(user), 1);

    })

    this.socketService.listenToEvent('user-join-room').subscribe(({username}) => {

      this.room.messages.push({
        type: MessageType.UserJoined,
        user: username,
        timestamp: Date.now(),
      })


      if(!this.room.users){
        this.room.users = [];
      }

      this.room.users.push(username)


    })

    this.socketService.listenToEvent('chat').subscribe(({user, message, timestamp}) => {
      this.room.messages.push({
        type: MessageType.Chat,
        user: user,
        timestamp,
        message,
      })
    })

    this.socketService.listenToEvent('video-offer').subscribe((evt) => {
      this.logging.info(JSON.stringify(evt));
    })

    this.socketService.listenToEvent('chat-sent-success').subscribe((evt) => {
      this.logging.debug("Chat Successfully Sent!")
    })
    


    this.route.params.subscribe(async ({ id }) => {
      this.roomID = id;

      try{

        this.socketService.isRoomPrivate(this.roomID);

        const {isPrivate} = await this.socketService.listenToEventOnce('is-room-private-success') as {isPrivate: boolean}


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

    this.socketService.sendChat(this.roomID, escaped)

    this.room.messages.push({
      type: MessageType.Chat,
      user: username,
      timestamp: Date.now(),
      message: escaped,
    });

    target.value = '';

  }
}
