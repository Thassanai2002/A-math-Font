import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'lobby', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    canActivate: [authGuard('login')],
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'lobby',
    loadComponent: () => import('./pages/lobby/lobby.component').then((m) => m.LobbyComponent),
    canActivate: [authGuard('lobby')],
  },
  {
    path: 'join',
    loadComponent: () => import('./pages/join/join.component').then((m) => m.JoinComponent),
    canActivate: [authGuard('lobby')],
  },
  {
    path: 'game/:gameId',
    loadComponent: () => import('./pages/game/game.component').then((m) => m.GameComponent),
    canActivate: [authGuard('lobby')],
  },
  { path: '**', redirectTo: 'lobby' },
];