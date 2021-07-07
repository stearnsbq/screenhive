import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-add-friend-dialog',
  templateUrl: './add-friend-dialog.component.html',
  styleUrls: ['./add-friend-dialog.component.scss']
})
export class AddFriendDialogComponent implements OnInit {

  public isOpen: boolean;

  public username: string;
  public lastUsername: string; 
  public discriminator: string;

  constructor(private ref: ChangeDetectorRef) {
    this.isOpen = true;
   }

  ngOnInit(): void {
  }

  @HostListener('document:keydown.escape', ['$event'])
  close(){
    this.isOpen = false;
  }

  open(){
    this.isOpen = true;
  }

  addFriend(username){
    console.log(username)
  }


  onUsernameInput(event){

    const input = event.target;
    
    const startPos = input.selectionStart;
    const endPos = input.selectionEnd;

    const newName = input.value.substring(0, startPos) + event.key + input.value.substring(endPos, input.value.length)

    const [username, discriminator] = newName.split("#");

    if((discriminator || "").length > 4){
      event.preventDefault()
    }
  
  }

}
