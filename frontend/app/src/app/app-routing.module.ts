import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthGuard } from './auth.guard';
import { LoggedInGuard } from './logged-in.guard';

const routes: Routes = [
  {path: '', loadChildren: () => import('./landing/landing.module').then(m => m.LandingModule), canActivate: [LoggedInGuard] },
  {path: "rooms", canActivate: [AuthGuard], loadChildren: () => import('./rooms/rooms.module').then(m => m.RoomsModule)},
  {path: "room/:id", canActivate: [AuthGuard], loadChildren: () => import('./room/room.module').then(m => m.RoomModule) }
]
;

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
