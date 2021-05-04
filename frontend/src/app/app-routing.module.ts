import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {path: "", loadChildren: () => import('./landing/landing.module').then(m => m.LandingModule) },
  {path: "app", loadChildren: () => import('./main-app/main-app.module').then(m => m.MainAppModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
