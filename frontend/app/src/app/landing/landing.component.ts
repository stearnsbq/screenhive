import { DropdownComponent } from './dropdown/dropdown.component';
import { Component, HostListener, OnInit, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { fromEvent } from 'rxjs';

import {map} from 'rxjs/operators';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit {
  public currentDropDown : DropdownComponent;
  public scroll: number;
  public currYear: number;
  @ViewChild("header") header : ElementRef;
  @ViewChild("content") content;

  constructor(private renderer: Renderer2) {
    this.currYear = new Date().getFullYear()
  }

  ngAfterViewInit(){

  }


  onDropDown(event){
    if(this.currentDropDown){
        this.currentDropDown.isOpen = this.currentDropDown.toggleText === event.toggleText;
    }
    this.currentDropDown = event;
  }


  private clamp(num, min, max){
    return num <= min ? min : num >= max ? max : num;
  }

  @HostListener('window:scroll', ['$event.target.scrollingElement'])
  onScroll(event) {

    this.scroll = event.scrollTop;

  }

}
