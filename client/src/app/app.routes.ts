import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'groups' },
  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-list').then((m) => m.GroupList),
  },
  {
    path: 'groups/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-form').then((m) => m.GroupForm),
  },
  {
    path: 'groups/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-form').then((m) => m.GroupForm),
  },
  {
    path: 'groups/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat-room').then((m) => m.ChatRoom),
  },
  {
    path: 'invitations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/invitations/invitations').then((m) => m.Invitations),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register').then((m) => m.Register),
  },
  {
    path: 'debug',
    loadComponent: () => import('./features/debug/connection-debug').then((m) => m.ConnectionDebug),
  },
  { path: '**', redirectTo: '' },
];
