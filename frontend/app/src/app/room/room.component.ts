import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements AfterViewInit {
  @ViewChild("player") player: ElementRef;
  public chatExpanded: boolean
  public playerVolume: number;
  public muted : boolean;
  public messages: {user: string, timestamp: Date, message: string}[]
  public roomID: string;

  constructor(private auth : AuthService, private socketService: WebsocketService,  private route: ActivatedRoute, ) { 
    this.chatExpanded = true;
    this.muted = false;
    this.playerVolume = 0.0;
    this.messages = []
  }

  ngAfterViewInit(){
    this.mute()
    this.route.params.subscribe(({id}) => {
      this.roomID = id;
    })
  }

  onVolumeChange(){
    this.player.nativeElement.volume = this.playerVolume;
    this.muted = false;
  }

  mute(){
    this.player.nativeElement.volume = 0;
    this.muted = true;
  }

  unmute(){
    if(this.muted){
      this.player.nativeElement.volume = this.playerVolume;
      this.muted = false;
    }
  }


  sendChat(target){
    const {username} = this.auth.user();

    this.messages.push({user: username, timestamp: new Date(), message: target.value })

    
    this.socketService.sendChat(this.roomID, target.value).subscribe()

  }



}
