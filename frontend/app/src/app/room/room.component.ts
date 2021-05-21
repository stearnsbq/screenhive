import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LoggingService } from '../logging.service';
import { WebsocketService } from '../websocket.service';

enum MessageType {
  Chat = 1,
  Event = 2,
}

interface Room {
  name: string;
  users: string[];
  messages: {
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
    private logging: LoggingService
  ) {
    this.chatExpanded = true;
    this.muted = false;
    this.playerVolume = 0.0;
    this.isPasswordDialogOpen = false;
  }


  ngOnDestroy(){
    this.socketService.leaveRoom(this.roomID).then((val) => {
      this.logging.debug(`Left Room ${this.room.name} with id ${this.roomID}`)
    })
  }

  ngOnInit() {

    this.socketService.getRoomEvents().subscribe((evt) => {

      console.log(evt)

    })


    this.route.params.subscribe(async ({ id }) => {
      try {
        this.roomID = id;

        const { isPrivate } = (await this.socketService.isRoomPrivate(
          id
        )) as any;

        let password = '';

        if (isPrivate) {
          this.isPasswordDialogOpen = true;

          password = await new Promise((resolve, reject) => {
            const listener = (event) => {
              resolve(event.target.value);
              this.roomPasswordInput.nativeElement.removeEventListener(
                'change',
                listener
              );
            };

            this.roomPasswordInput.nativeElement.addEventListener(
              'change',
              listener
            );
          });
        }

        this.room = (await this.socketService.joinRoom(
          this.roomID,
          password
        )) as any;

        this.room.messages.push({
          type: MessageType.Event,
          user: "You",
          timestamp: Date.now(),
          message: "You joined",
        });

        this.isPasswordDialogOpen = false;
      } catch (err) {
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
