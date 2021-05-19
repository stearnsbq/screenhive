import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { WebsocketService } from '../websocket.service';


interface Room{
  name: string;
	users: string[];
	messages: { user: string; timestamp: number; message: string }[];
}



@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  @ViewChild("player") player: ElementRef;
  @ViewChild("roomPasswordInput") roomPasswordInput: ElementRef;
  public chatExpanded: boolean
  public playerVolume: number;
  public muted : boolean;
  public roomID: string;
  public room: Room

  public isPasswordDialogOpen: boolean;

  constructor(private auth : AuthService, private socketService: WebsocketService,  private route: ActivatedRoute, private router: Router ) { 
    this.chatExpanded = true;
    this.muted = false;
    this.playerVolume = 0.0;
    this.isPasswordDialogOpen = true;

  }

  ngOnInit(){
    this.route.params.subscribe(async ({id}) => {

      try{

        this.roomID = id;
  
        const {isPrivate} = await this.socketService.isRoomPrivate(id) as any;
  
        let password = '';
  
  
        if(isPrivate){

          this.isPasswordDialogOpen = true;

          password = await new Promise((resolve, reject) => {

            const listener = (event) => {
              resolve(event.target.value);
              this.roomPasswordInput.nativeElement.removeEventListener("change", listener);
            }

            this.roomPasswordInput.nativeElement.addEventListener("change", listener)

          })


        }
  
  
        this.socketService.joinRoom(this.roomID, password).then((room: any) => {
  
          this.room = room;
          this.isPasswordDialogOpen = false;
  
        }).catch((err) => {
          console.error(err)
          this.router.navigate(['/'])
        })

      }catch(err){
        this.router.navigate(['/'])
          console.log(err)
      }



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

    //this.messages.push({user: username, timestamp: new Date(), message: target.value })


    this.socketService.sendChat(this.roomID, target.value).then((message) => {
      console.log("then: ", message)
    }).catch((err) => {
      console.error(err)
    })

  }



}
