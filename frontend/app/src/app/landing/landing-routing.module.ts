import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoggedInGuard } from '../logged-in.guard';
import { LandingComponent } from './landing.component';


const routes: Routes = [
  {path: '', component: LandingComponent, canActivate: [LoggedInGuard] },
]
;

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingRoutingModule { }
