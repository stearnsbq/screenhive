import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements OnInit {
  @Input() isOpen: boolean;
  @Input() toggleText: string;
  @Output() toggled = new EventEmitter<this>();

  constructor() {
    this.isOpen = false;
  }

  public open(){
    this.isOpen = true;
    this.toggled.emit(this);
  }

  public close(){
    this.isOpen = false;
  }

  ngOnInit(): void {
  }

}
