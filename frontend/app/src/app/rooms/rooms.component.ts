import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as Honeycomb from 'honeycomb-grid';
import * as svgjs from '@svgdotjs/svg.js';
import { WebsocketService } from '../websocket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent implements AfterViewInit {
  @ViewChild("grid") grid: ElementRef;

  constructor(private websocketService: WebsocketService, private router: Router) { }

  ngAfterViewInit(){





  }
  


  public enterRoom(){
    this.router.navigate(["/room"])
  }



}
